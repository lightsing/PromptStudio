import styles from './Editor.module.css'
import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
import {
  Button,
  Dropdown,
  Option,
  Input,
  Slider,
  Textarea,
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionPanel,
} from '@fluentui/react-components'
import { Send16Regular } from '@fluentui/react-icons'
import { useAppConfig, useChat, useAvailableModels } from '../utils/hooks.ts'
import { Logger } from '../utils/log.ts'
import { tokens } from '@fluentui/react-theme'
import { mergeStyleSets } from '@fluentui/react'
import { listen } from '@tauri-apps/api/event'
import { ChatRole } from '../utils/command.ts'

const logger = new Logger('Editor.tsx')

interface EditorProps {
  uuid: string
}

const Editor = ({ uuid }: EditorProps) => {
  const { t } = useTranslation()

  const { appConfig, errorAppConfig, isAppConfigLoading } = useAppConfig()
  const isAppConfigOk = !(isAppConfigLoading || errorAppConfig)
  const {
    chatConfig,
    errorChatConfig,
    isChatConfigLoading,
    chatHistory,
    updateChatConfig,
    setChatConfig,
    sendMessage,
    streamUpdateHistory,
  } = useChat(uuid)
  const isChatConfigOk = !(isChatConfigLoading || errorChatConfig)
  const { models: availableModels, errorModels, isModelsLoading } = useAvailableModels()
  const isAvailableModelsOk = !(isModelsLoading || errorModels)

  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!isAppConfigOk || !isChatConfigOk || !isAvailableModelsOk) {
      return
    }
    const init = async () => {
      if (!chatConfig!.model) {
        await updateChatConfig({ model: appConfig!.defaultModel || availableModels![0] })
      }
    }
    init().catch(logger.error('init'))
  }, [appConfig, isChatConfigOk, chatConfig, updateChatConfig, isAppConfigOk, availableModels, isAvailableModelsOk])

  useEffect(() => {
    interface ChatStreamEvent {
      choices: ChatStreamEventChoice[]
    }
    interface ChatStreamEventChoice {
      index: number
      delta: ChatStreamEventChoiceDelta
      finish_reason: string | null
    }
    interface ChatStreamEventChoiceDelta {
      content: string | null
      role: ChatRole | null
    }

    const cancel = listen<[string, boolean, ChatStreamEvent]>('chat-stream', (event) => {
      const [eventUuid, isOk, data] = event.payload
      if (uuid !== eventUuid) {
        return
      }
      if (!isOk) {
        logger.error('chat-stream')(data)
        return
      }
      const delta = data.choices[0].delta
      if (delta.role === 'assistant') {
        streamUpdateHistory((current) => [...(current || []), { role: delta.role!, content: '' }]).catch(
          logger.error('streamUpdateHistory'),
        )
      } else if (delta.content) {
        streamUpdateHistory((current) => {
          const last = current![current!.length - 1]
          return [...current!.slice(0, -1), { ...last, content: last.content + delta.content! }]
        }).catch(logger.error('streamUpdateHistory'))
      }
    })

    return () => {
      cancel.then((fn) => fn())
    }
  }, [uuid, streamUpdateHistory])

  const messageStyle = {
    backgroundColor: tokens.colorNeutralBackground5,
    borderRadius: tokens.borderRadiusLarge,
    boxShadow: tokens.shadow2,
  }

  const messageStyles = mergeStyleSets({
    message: messageStyle,
    messageUser: { ...messageStyle, backgroundColor: tokens.colorBrandBackground },
  })

  return (
    <div className={styles.editor}>
      <div className={styles.panel}>
        <Input
          className={styles.name}
          placeholder={t('Editor.Name')}
          defaultValue={chatConfig?.name || ''}
          disabled={!isChatConfigOk}
          onChange={(e) => updateChatConfig({ name: e.target.value })}
        />
        <div className={styles['prompt-editor']}>
          <Textarea
            className={styles.prompt}
            placeholder={t('Editor.Prompt')}
            defaultValue={chatConfig?.prompt || ''}
            disabled={!isChatConfigOk}
            onChange={(e) => updateChatConfig({ prompt: e.target.value })}
          />
        </div>
        <Accordion collapsible>
          <AccordionItem value="1">
            <AccordionHeader>{t('Editor.ParameterSettings')}</AccordionHeader>
            <AccordionPanel>
              <div className={styles.settings}>
                <div className={styles.setting}>
                  <span className={styles['setting-label']}>{t('Model')}</span>
                  <Dropdown
                    placeholder={t('SelectModel')}
                    id="model"
                    size="small"
                    className={styles['setting-value']}
                    defaultValue={chatConfig?.model || ''}
                    disabled={!isChatConfigOk || !isAvailableModelsOk}
                    onOptionSelect={(_, data) => {
                      updateChatConfig({ model: data.optionText }).catch(console.error)
                    }}>
                    {availableModels?.map((option) => <Option key={option}>{option}</Option>)}
                  </Dropdown>
                </div>
                <div className={styles.setting}>
                  <span className={styles['setting-label']} title={t('Editor.About.FrequencyPenalty')}>
                    {t('Editor.FrequencyPenalty')}
                  </span>
                  <Slider
                    className={styles['setting-value']}
                    id="frequency-penalty"
                    size="small"
                    min={-2.0}
                    max={2.0}
                    step={0.01}
                    disabled={!isChatConfigOk}
                    defaultValue={chatConfig?.frequencyPenalty || 0}
                  />
                </div>
                <div className={styles.setting}>
                  <span className={styles['setting-label']} title={t('Editor.About.PresencePenalty')}>
                    {t('Editor.PresencePenalty')}
                  </span>
                  <Slider
                    className={styles['setting-value']}
                    size="small"
                    min={-2.0}
                    max={2.0}
                    defaultValue={0}
                    step={0.01}
                    disabled={!isChatConfigOk}
                    value={chatConfig?.presencePenalty || 0}
                    onChange={(_, data) => updateChatConfig({ presencePenalty: data.value })}
                    id="presence-penalty"
                  />
                </div>
                <div className={styles.setting}>
                  <span className={styles['setting-label']} title={t('Editor.About.MaxTokens')}>
                    {t('Editor.MaxTokens')}
                  </span>
                  <Input
                    className={styles['setting-value']}
                    placeholder="inf"
                    disabled={!isChatConfigOk}
                    value={chatConfig?.maxTokens?.toString() || ''}
                    onChange={(e) => {
                      const tokens = parseInt(e.target.value)
                      const newConfig = { ...chatConfig, maxTokens: Number.isNaN(tokens) ? undefined : tokens }
                      updateChatConfig(newConfig).catch(console.error)
                    }}
                    contentAfter={
                      chatConfig?.maxTokens ?
                        <span
                          className="icon Cancel"
                          onClick={() => {
                            const newConfig = { ...chatConfig, maxTokens: undefined }
                            setChatConfig(newConfig).catch(console.error)
                          }}></span>
                      : undefined
                    }
                  />
                </div>
                <div className={styles.setting}>
                  <span className={styles['setting-label']} title={t('Editor.About.Temperature')}>
                    {t('Editor.Temperature')}
                  </span>
                  <Slider
                    className={styles['setting-value']}
                    size="small"
                    min={0}
                    max={2.0}
                    defaultValue={1}
                    step={0.01}
                    disabled={!isChatConfigOk}
                    value={chatConfig?.temperature || 1}
                    onChange={(_, data) => updateChatConfig({ temperature: data.value })}
                    id="temperature"
                  />
                </div>
                <div className={styles.setting}>
                  <span className={styles['setting-label']} title={t('Editor.About.TopP')}>
                    {t('Editor.TopP')}
                  </span>
                  <Slider
                    className={styles['setting-value']}
                    size="small"
                    min={0}
                    max={1}
                    defaultValue={1}
                    step={0.01}
                    disabled={!isChatConfigOk}
                    value={chatConfig?.topP || 1}
                    onChange={(_, data) => updateChatConfig({ topP: data.value })}
                    id="top-p"
                  />
                </div>
              </div>
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
      </div>
      <div className={styles.right}>
        <div className={styles['message-list']}>
          {chatHistory?.map((item, index) => (
            <div
              className={`${styles.message} ${styles[`message-${item.role}`]} ${
                item.role === 'user' ? messageStyles.messageUser : messageStyles.message
              }`}
              key={index}>
              {item.content}
            </div>
          ))}
        </div>
        <div className={styles.sending}>
          <Textarea
            className={styles['sending-area']}
            placeholder={t('Editor.SaySomething')}
            disabled={!isChatConfigOk}
            value={message}
            onChange={(_, data) => setMessage(data.value)}
          />
          <Button
            className={styles['sending-button']}
            icon={<Send16Regular />}
            appearance="primary"
            disabled={!isChatConfigOk || message.trim() === ''}
            onClick={() => {
              sendMessage(message).catch(logger.error('sendMessage'))
              setMessage('')
            }}
          />
        </div>
      </div>
    </div>
  )
}

export default Editor
