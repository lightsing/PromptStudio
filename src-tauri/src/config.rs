use crate::error::{Error, LogError};
use crate::Result;
use directories::ProjectDirs;
use once_cell::sync::Lazy;
use secrecy::{CloneableSecret, DebugSecret, ExposeSecret, Secret, SerializableSecret, Zeroize};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use sys_locale::get_locale;
use tauri::async_runtime::Mutex;

pub static PROJECT_DIR: Lazy<ProjectDirs> =
    Lazy::new(|| ProjectDirs::from("me", "lightsing", "gpt-editor").unwrap());

pub static CONFIG: Lazy<Mutex<Config>> = Lazy::new(|| Config::load().unwrap().into());
pub static PERSISTENT_DATA: Lazy<sled::Db> = Lazy::new(|| {
    std::fs::create_dir_all(PROJECT_DIR.data_dir()).unwrap();
    let path = PROJECT_DIR.data_dir().join("data");
    info!("Loading persistent data from {:?}", path);
    sled::open(path).unwrap()
});

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Config {
    pub openai: OpenAIConfig,
    pub default_model: Option<String>,
    pub language: String,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            openai: OpenAIConfig::default(),
            default_model: None,
            language: get_locale().unwrap_or_else(|| String::from("en-US")),
        }
    }
}

#[derive(Clone, Serialize, Deserialize)]
pub struct ApiKey(String);

impl Zeroize for ApiKey {
    fn zeroize(&mut self) {
        self.0.zeroize();
    }
}

impl DebugSecret for ApiKey {}

impl CloneableSecret for ApiKey {}

impl SerializableSecret for ApiKey {}

impl<S: AsRef<str>> From<S> for ApiKey {
    fn from(s: S) -> Self {
        Self(s.as_ref().to_string())
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OpenAIConfig {
    pub api_base: String,
    pub api_key: Secret<ApiKey>,
    pub org_id: String,
}

impl Default for OpenAIConfig {
    fn default() -> Self {
        Self {
            api_base: "https://api.openai.com/v1".to_string(),
            api_key: ApiKey(
                std::env::var("OPENAI_API_KEY").unwrap_or_else(|_| "sk-xxx".to_string()),
            )
            .into(),
            org_id: Default::default(),
        }
    }
}

impl From<&OpenAIConfig> for async_openai::config::OpenAIConfig {
    fn from(config: &OpenAIConfig) -> Self {
        Self::new()
            .with_api_base(&config.api_base)
            .with_api_key(&config.api_key.expose_secret().0)
            .with_org_id(&config.org_id)
    }
}

impl Config {
    fn path() -> PathBuf {
        std::fs::create_dir_all(PROJECT_DIR.config_dir()).unwrap();
        PROJECT_DIR.config_dir().join("config.json")
    }

    pub fn load() -> Result<Self> {
        let path = Self::path();
        info!("Loading config from {:?}", path);
        if path.exists() {
            let file = std::fs::File::open(path)
                .log_err("Fail to open config file", Error::FailToOpenConfigFile)?;
            Ok(serde_json::from_reader(file)
                .log_err("Fail to parse config file", Error::InvalidConfigFile)?)
        } else {
            let default_config = Self::default();
            default_config.save()?;
            Ok(default_config)
        }
    }

    pub fn save(&self) -> Result<()> {
        let path = Self::path();
        let file = std::fs::File::create(path)
            .log_err("Fail to create config file", Error::FailToOpenConfigFile)?;
        serde_json::to_writer_pretty(file, self)
            .log_err("Fail to write config file", Error::FailToWriteConfigFile)
    }
}
