import style from './Settings.module.css'
import { Dropdown, Input, Label, Option } from '@fluentui/react-components'
import { useTranslation } from 'react-i18next'
import { LocalLanguage16Regular } from '@fluentui/react-icons'
import { useEffect } from 'react'
import { useAppConfig, useAvailableModels } from '../utils/hooks.ts'
import { Logger } from '../utils/log.ts'

const languageOptions = [
  { display: 'English', value: 'en-US' },
  { display: '简体中文', value: 'zh-CN' },
]

const logger = new Logger('Settings.tsx')

const Settings = () => {
  const { t, i18n } = useTranslation()
  const { models, errorModels, isModelsLoading } = useAvailableModels()
  const { appConfig, errorAppConfig, isAppConfigLoading, updateAppConfig } = useAppConfig()

  useEffect(() => {
    if (isAppConfigLoading || errorAppConfig) {
      return
    }
    const init = async () => {
      if (!languageOptions.some(({ value }) => appConfig!.language === value)) {
        await updateAppConfig({
          language: 'zh-CN',
        })
      }
    }
    init().catch(logger.error('init'))
  }, [appConfig, errorAppConfig, isAppConfigLoading, updateAppConfig])

  const selectLanguage = async (lang: string) => {
    await Promise.all([updateAppConfig({ language: lang }), i18n.changeLanguage(lang)])
  }

  return (
    <div className={style.root}>
      <h1>{t('Page.Settings')}</h1>
      <div className={style.settings}>
        <h2>{t('Settings.OpenAISettings')}</h2>
        <div className={style['setting-group']}>
          <div className={style['setting-item']}>
            <Label htmlFor="api-key" className="setting-item-label">
              {t('Settings.ApiKey')}
            </Label>
            <Input
              className={`${style['setting-item-value']} ${style['api-key']}`}
              disabled={isAppConfigLoading || errorAppConfig}
              value={appConfig?.openai.apiKey || ''}
              onChange={(e) => updateAppConfig({ openai: { apiKey: e.target.value } })}
            />
          </div>
          <div className={style['setting-item']}>
            <Label htmlFor="api-base" className="setting-item-label">
              {t('Settings.ApiBase')}
            </Label>
            <Input
              className={style['setting-item-value']}
              disabled={isAppConfigLoading || errorAppConfig}
              value={appConfig?.openai.apiBase || ''}
              onChange={(e) => updateAppConfig({ openai: { apiBase: e.target.value } })}
            />
          </div>
          <div className={style['setting-item']}>
            <Label htmlFor="org-id" className={style['setting-item-label']}>
              {t('Settings.OrgId')}
            </Label>
            <Input
              className={style['setting-item-value']}
              disabled={isAppConfigLoading || errorAppConfig}
              value={appConfig?.openai.orgId || ''}
              onChange={(e) => updateAppConfig({ openai: { orgId: e.target.value } })}
            />
          </div>
          <div className={style['setting-item']}>
            <Label htmlFor="default-model" className={style['setting-item-label']}>
              {t('Settings.DefaultModel')}
            </Label>
            <Dropdown
              placeholder={t('Settings.DefaultModelUnSet')}
              id="model"
              size="medium"
              className={style['setting-value']}
              defaultValue={appConfig?.defaultModel}
              disabled={isAppConfigLoading || errorAppConfig || isModelsLoading || errorModels}
              onOptionSelect={(_, data) => updateAppConfig({ defaultModel: data.optionText })}>
              {models?.map((option) => <Option key={option}>{option}</Option>)}
            </Dropdown>
          </div>
        </div>
        <h2>{t('Settings.GeneralSettings')}</h2>
        <div className={style['setting-group']}>
          <div className={style['setting-item']}>
            <Label htmlFor="selectLanugage" className={style['setting-item-label']}>
              <LocalLanguage16Regular />
              {t('Settings.SelectLanguage')}
            </Label>
            <Dropdown
              placeholder={t('Settings.SelectLanguage')}
              id="selectLanugage"
              size="medium"
              className={style['setting-value']}
              defaultValue={appConfig?.language}
              disabled={isAppConfigLoading || errorAppConfig}
              onOptionSelect={(_, data) => selectLanguage(data.optionText!).catch(logger.error('selectLanguage'))}>
              {languageOptions.map(({ display, value }) => (
                <Option key={value} text={value}>
                  {display}
                </Option>
              ))}
            </Dropdown>
          </div>
        </div>
        <h2>{t('Settings.PrivacySettings')}</h2>
      </div>
    </div>
  )
}

export default Settings
