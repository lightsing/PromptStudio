use crate::config::{Config, CONFIG, PERSISTENT_DATA};
use async_openai::config::OpenAIConfig;
use async_openai::error::OpenAIError;
use async_openai::types::{
    ChatCompletionRequestAssistantMessageArgs, ChatCompletionRequestMessage,
    ChatCompletionRequestSystemMessageArgs, ChatCompletionRequestUserMessageArgs,
    CreateChatCompletionRequestArgs,
};
use futures_util::stream::StreamExt;
use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};
use tauri::async_runtime::{spawn, Mutex};
use tauri::command;
use uuid::Uuid;

static CLIENT: Lazy<Mutex<Option<async_openai::Client<OpenAIConfig>>>> =
    Lazy::new(|| Mutex::new(None));

async fn create_client() -> async_openai::Client<OpenAIConfig> {
    let config = &CONFIG.lock().await.openai;
    async_openai::Client::with_config(config.into())
}

// client is under rc, so clone is cheap
pub async fn get_client() -> async_openai::Client<OpenAIConfig> {
    let mut guard = CLIENT.lock().await;
    if guard.is_none() {
        guard.replace(create_client().await);
    }
    guard.clone().unwrap()
}

pub async fn reload_client() {
    *CLIENT.lock().await = Some(create_client().await);
}

#[derive(Debug, Clone, Serialize)]
pub enum CommandError {
    ChatConfig(ChatConfigError),
    OpenAI(CommandOpenAIError),
    Db(String),
}

#[derive(Debug, Clone, Serialize)]
pub enum CommandOpenAIError {
    HttpError(String),
    ApiError(String),
    JSONDeserialize(String),
    FileSaveError(String),
    FileReadError(String),
    StreamError(String),
    InvalidArgument(String),
}

impl From<OpenAIError> for CommandOpenAIError {
    fn from(e: OpenAIError) -> Self {
        match e {
            OpenAIError::Reqwest(e) => CommandOpenAIError::HttpError(e.to_string()),
            OpenAIError::ApiError(e) => CommandOpenAIError::ApiError(e.message),
            OpenAIError::JSONDeserialize(e) => CommandOpenAIError::JSONDeserialize(e.to_string()),
            OpenAIError::FileSaveError(e) => CommandOpenAIError::FileSaveError(e),
            OpenAIError::FileReadError(e) => CommandOpenAIError::FileReadError(e),
            OpenAIError::StreamError(e) => CommandOpenAIError::StreamError(e),
            OpenAIError::InvalidArgument(e) => CommandOpenAIError::InvalidArgument(e),
        }
    }
}

impl From<OpenAIError> for CommandError {
    fn from(e: OpenAIError) -> Self {
        CommandError::OpenAI(e.into())
    }
}

impl From<sled::Error> for CommandError {
    fn from(e: sled::Error) -> Self {
        CommandError::Db(e.to_string())
    }
}

impl From<ChatConfigError> for CommandError {
    fn from(e: ChatConfigError) -> Self {
        CommandError::ChatConfig(e)
    }
}

#[command]
pub async fn get_available_models() -> Result<Vec<String>, CommandError> {
    let client = get_client().await;
    let models = client
        .models()
        .list()
        .await
        .map(|res| {
            res.data
                .into_iter()
                .map(|model| model.id)
                .filter(|id| id.starts_with("gpt"))
                .collect::<Vec<_>>()
        })
        .map_err(CommandError::from)?;
    PERSISTENT_DATA.insert("models", serde_json::to_vec(&models).unwrap())?;
    Ok(models)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ChatConfig {
    pub uuid: Uuid,
    pub name: Option<String>,
    pub model: Option<String>,
    pub prompt: String,
    pub frequency_penalty: Option<f32>,
    pub presence_penalty: Option<f32>,
    pub max_tokens: Option<u16>,
    pub temperature: Option<f32>,
    pub top_p: Option<f32>,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

impl Default for ChatConfig {
    fn default() -> Self {
        Self {
            uuid: Uuid::new_v4(),
            name: None,
            model: None,
            prompt: String::new(),
            frequency_penalty: None,
            presence_penalty: None,
            max_tokens: None,
            temperature: None,
            top_p: None,
            created_at: chrono::Utc::now(),
        }
    }
}

#[derive(Debug, Clone, Serialize)]
pub enum ChatConfigError {
    ModelNotSet,
}

#[command]
pub async fn get_app_config() -> Config {
    CONFIG.lock().await.clone()
}

#[command]
pub async fn update_app_config(config: Config) {
    {
        let mut guard = CONFIG.lock().await;
        *guard = config;
        guard.save().unwrap();
    }
    reload_client().await;
}

#[command]
pub async fn create_chat_config() -> Result<ChatConfig, CommandError> {
    let config = ChatConfig::default();
    PERSISTENT_DATA.open_tree("chat_config")?.insert(
        config.uuid.to_string(),
        serde_json::to_vec(&config).unwrap(),
    )?;
    Ok(config)
}

#[command]
pub async fn get_chat_config(uuid: Uuid) -> Result<Option<ChatConfig>, CommandError> {
    Ok(PERSISTENT_DATA
        .open_tree("chat_config")?
        .get(uuid.to_string())?
        .map(|data| serde_json::from_slice(&data).unwrap()))
}

#[command]
pub async fn update_chat_config(config: ChatConfig) -> Result<(), CommandError> {
    PERSISTENT_DATA.open_tree("chat_config")?.insert(
        config.uuid.to_string(),
        serde_json::to_vec(&config).unwrap(),
    )?;
    Ok(())
}

#[command]
pub async fn delete_chat_config(uuid: Uuid) -> Result<(), CommandError> {
    PERSISTENT_DATA
        .open_tree("chat_config")?
        .remove(uuid.to_string())?;
    Ok(())
}

#[command]
pub async fn list_chat_configs() -> Result<Vec<ChatConfig>, CommandError> {
    let tree = PERSISTENT_DATA.open_tree("chat_config")?;
    let mut configs = tree
        .iter()
        .map(|res| {
            let (_, data) = res.unwrap();
            serde_json::from_slice(&data).unwrap()
        })
        .collect::<Vec<ChatConfig>>();
    configs.retain(|config| {
        let cond = config.model.is_some() && (!config.prompt.is_empty() || config.name.is_some());
        if !cond {
            tree.remove(config.uuid.to_string()).unwrap();
        }
        cond
    });
    configs.sort_by(|a, b| a.created_at.cmp(&b.created_at));
    Ok(configs)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatMessage {
    pub role: ChatRole,
    pub content: String,
}

#[derive(Debug, Copy, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum ChatRole {
    User,
    Assistant,
}

#[command]
pub async fn chat_use_config(
    window: tauri::Window,
    config: ChatConfig,
    message: String,
) -> Result<(), CommandError> {
    PERSISTENT_DATA.open_tree("chat_config")?.insert(
        config.uuid.to_string(),
        serde_json::to_vec(&config).unwrap(),
    )?;
    let model = config.model.ok_or(ChatConfigError::ModelNotSet)?;
    let mut history_messages: Vec<ChatMessage> = PERSISTENT_DATA
        .open_tree("chat_history")?
        .get(config.uuid.to_string())?
        .map(|data| serde_json::from_slice(&data).unwrap())
        .unwrap_or_default();
    let mut messages: Vec<ChatCompletionRequestMessage> = history_messages
        .iter()
        .map(|message| match message.role {
            ChatRole::User => ChatCompletionRequestUserMessageArgs::default()
                .content(message.content.as_str())
                .build()
                .unwrap()
                .into(),
            ChatRole::Assistant => ChatCompletionRequestAssistantMessageArgs::default()
                .content(message.content.as_str())
                .build()
                .unwrap()
                .into(),
        })
        .collect();
    messages.insert(
        0,
        ChatCompletionRequestSystemMessageArgs::default()
            .content(config.prompt)
            .build()
            .unwrap()
            .into(),
    );
    messages.push(
        ChatCompletionRequestUserMessageArgs::default()
            .content(message.as_str())
            .build()
            .unwrap()
            .into(),
    );
    let mut request = CreateChatCompletionRequestArgs::default();
    request.model(model).messages(messages);
    if let Some(frequency_penalty) = config.frequency_penalty {
        request.frequency_penalty(frequency_penalty);
    }
    if let Some(presence_penalty) = config.presence_penalty {
        request.presence_penalty(presence_penalty);
    }
    if let Some(max_tokens) = config.max_tokens {
        request.max_tokens(max_tokens);
    }
    if let Some(temperature) = config.temperature {
        request.temperature(temperature);
    }
    if let Some(top_p) = config.top_p {
        request.top_p(top_p);
    }
    let request = request.build().map_err(CommandError::from)?;
    let mut response = get_client()
        .await
        .chat()
        .create_stream(request)
        .await
        .map_err(CommandError::from)?;

    history_messages.push(ChatMessage {
        role: ChatRole::User,
        content: message,
    });
    PERSISTENT_DATA.open_tree("chat_history")?.insert(
        config.uuid.to_string(),
        serde_json::to_vec(&history_messages).unwrap(),
    )?;

    spawn(async move {
        let mut content = String::new();
        while let Some(result) = response.next().await {
            let emit = match result {
                Ok(res) => {
                    if let Some(delta) = res.choices.first().and_then(|c| c.delta.content.as_ref())
                    {
                        content.push_str(delta);
                    }
                    window.emit("chat-stream", (config.uuid, true, res))
                }
                Err(e) => window.emit(
                    "chat-stream-error",
                    (config.uuid, false, CommandError::from(e)),
                ),
            };
            if let Err(e) = emit {
                error!("emit error: {}", e);
            }
        }
        history_messages.push(ChatMessage {
            role: ChatRole::Assistant,
            content: content.clone(),
        });
        PERSISTENT_DATA
            .open_tree("chat_history")
            .unwrap()
            .insert(
                config.uuid.to_string(),
                serde_json::to_vec(&history_messages).unwrap(),
            )
            .unwrap();
    });
    Ok(())
}

#[command]
pub async fn get_chat_history(uuid: Uuid) -> Result<Vec<ChatMessage>, CommandError> {
    Ok(PERSISTENT_DATA
        .open_tree("chat_history")?
        .get(uuid.to_string())?
        .map(|data| serde_json::from_slice(&data).unwrap())
        .unwrap_or_default())
}
