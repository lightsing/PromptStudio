import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import * as en_US from '../i18n/en-US.json'
import * as zh_CN from '../i18n/zh-CN.json'

import 'moment/dist/locale/zh-cn'

i18n.use(initReactI18next).init({
  resources: {
    'en-US': {
      translation: en_US,
    },
    'zh-CN': {
      translation: zh_CN,
    },
  },
  lng: 'zh-CN',
  fallbackLng: 'en-US',

  interpolation: {
    escapeValue: false,
  },
})

export default i18n
