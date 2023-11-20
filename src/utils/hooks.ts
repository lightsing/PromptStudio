import useSWR, { useSWRConfig } from 'swr'
import {
  ChatConfig,
  chatUseConfig,
  Config,
  deleteChatConfig,
  getAppConfig,
  getAvailableModels,
  getChatConfig,
  getChatHistory,
  HistoryMessage,
  listChatConfigs,
  updateAppConfig,
  updateChatConfig,
} from './command.ts'
import _ from 'lodash'

type RecursivePartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[] ? RecursivePartial<U>[]
  : T[P] extends object | undefined ? RecursivePartial<T[P]>
  : T[P]
}

export const useAvailableModels = () => {
  const { data, error, isLoading } = useSWR('get_available_models', getAvailableModels, {
    revalidateOnReconnect: true,
    revalidateOnMount: true,
    revalidateIfStale: true,
  })

  return {
    models: data,
    errorModels: error,
    isModelsLoading: isLoading,
  }
}

export const useAppConfig = () => {
  const { data, error, isLoading, mutate } = useSWR('get_app_config', getAppConfig)
  const { mutate: globalMutate } = useSWRConfig()

  const update = async (changes: RecursivePartial<Config>) => {
    await mutate(async (current) => {
      const updated = _.merge(current, changes) as Config
      await updateAppConfig(updated)
      await globalMutate('get_available_models')
      return updated
    })
  }

  return {
    appConfig: data,
    errorAppConfig: error,
    isAppConfigLoading: isLoading,
    updateAppConfig: update,
  }
}

export const useChat = (uuid: string) => {
  const {
    data: config,
    error: errorChatConfig,
    isLoading: isChatConfigLoading,
    mutate: mutateConfig,
  } = useSWR(['get_chat_config', uuid], () => getChatConfig(uuid))
  const {
    data: history,
    error: errorChatHistory,
    isLoading: isChatHistoryLoading,
    mutate: mutateHistory,
  } = useSWR(['get_chat_history', uuid], () => getChatHistory(uuid))

  const updateConfig = async (changes: Partial<ChatConfig>) => {
    await mutateConfig(async (current) => {
      const updated = _.merge(current, changes) as ChatConfig
      await updateChatConfig(updated)
      return updated
    })
  }

  const setConfig = async (config: ChatConfig) => {
    await mutateConfig(async () => {
      await updateChatConfig(config)
      return config
    })
  }

  const removeChat = async () => {
    await mutateConfig(async () => {
      await deleteChatConfig(uuid)
      await mutateHistory(undefined, false)
      return undefined
    })
  }

  const sendMessage = async (message: string) => {
    await Promise.all([
      await chatUseConfig(config!, message),
      await mutateHistory((current) => [...current!, { role: 'user', content: message }], {
        optimisticData: (current) => [...current!, { role: 'user', content: message }],
        revalidate: false,
      }),
    ])
  }

  const streamUpdateHistory = async (updater: (current: HistoryMessage[] | undefined) => HistoryMessage[]) => {
    await mutateHistory(updater, {
      optimisticData: updater,
      revalidate: false,
    })
  }

  return {
    chatConfig: config,
    chatHistory: history,
    errorChatConfig,
    errorChatHistory,
    isChatConfigLoading,
    isChatHistoryLoading,
    updateChatConfig: updateConfig,
    setChatConfig: setConfig,
    removeChat,
    sendMessage,
    streamUpdateHistory,
  }
}

export const useChatHistoryList = () => {
  const { data, error, isLoading, mutate } = useSWR('get_chat_history_list', listChatConfigs)

  const removeChat = async (uuid: string) => {
    await mutate(async (current) => {
      const updated = current!.filter((item) => item.uuid !== uuid)
      await deleteChatConfig(uuid)
      return updated
    })
  }

  return {
    chatHistoryList: data,
    errorChatHistoryList: error,
    isChatHistoryListLoading: isLoading,
    removeChat,
  }
}
