import { invoke } from '@tauri-apps/api'

export const closeSplashScreen = async (): Promise<void> => {
  await invoke<void>('close_splash_screen')
}

export interface Config {
  defaultModel?: string
  language: string
  openai: OpenAIConfig
}

export interface OpenAIConfig {
  apiBase: string
  apiKey: string
  orgId: string
}

export const getAppConfig = async (): Promise<Config> => {
  const res = await invoke<Config>('get_app_config')
  console.debug('GetAppConfig', res)
  return res
}

export const updateAppConfig = async (config: Config): Promise<void> => {
  console.debug('UpdateAppConfig', config)
  await invoke<void>('update_app_config', { config })
}

export const getAvailableModels = async (): Promise<string[]> => {
  const res = await invoke<string[]>('get_available_models')
  console.debug('GetAvailableModels', res)
  return res
}

export interface ChatConfig {
  uuid: string
  name?: string
  model?: string
  prompt: string
  frequencyPenalty?: number
  presencePenalty?: number
  maxTokens?: number
  temperature?: number
  topP?: number
  createdAt: string
}

export const createChatConfig = async (): Promise<ChatConfig> => {
  const res = await invoke<ChatConfig>('create_chat_config')
  console.debug('CreateChatConfig', res)
  return res
}

export const getChatConfig = async (uuid: string): Promise<ChatConfig> => {
  const res = await invoke<ChatConfig>('get_chat_config', { uuid })
  console.debug('GetChatConfig', res)
  return res
}

export const updateChatConfig = async (config: ChatConfig): Promise<void> => {
  console.debug('UpdateChatConfig', config)
  await invoke<void>('update_chat_config', { config })
}

export const deleteChatConfig = async (uuid: string): Promise<void> => {
  await invoke<void>('delete_chat_config', { uuid })
}

export const listChatConfigs = async (): Promise<ChatConfig[]> => {
  const res = await invoke<ChatConfig[]>('list_chat_configs')
  console.debug('ListChatConfigs', res)
  return res
}

export const chatUseConfig = async (config: ChatConfig, message: string): Promise<string> => {
  const res = await invoke<string>('chat_use_config', { config, message })
  console.debug('ChatUseConfig', res)
  return res
}

export interface HistoryMessage {
  role: ChatRole
  content: String
}

export type ChatRole = 'user' | 'assistant'

export const getChatHistory = async (uuid: string): Promise<HistoryMessage[]> => {
  const res = await invoke<HistoryMessage[]>('get_chat_history', { uuid })
  console.debug('GetChatHistory', res)
  return res
}
