import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrandVariants, createDarkTheme, createLightTheme, FluentProvider } from '@fluentui/react-components'
import App from './App'
import './styles.css'
import './fluent-icons.css'
import './utils/i18n.ts'
import { closeSplashScreen } from './utils/command.ts'
import { Logger } from './utils/log.ts'
import * as Sentry from '@sentry/react'

Sentry.init({
  dsn: 'https://37676da83e1cd3424fb11517e48c8f9e@o4506252707561472.ingest.sentry.io/4506252712411136',
  integrations: [
    new Sentry.BrowserTracing({
      // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
      tracePropagationTargets: ['localhost', /^https:\/\/yourserver\.io\/api/],
    }),
    new Sentry.Replay(),
  ],
  // Performance Monitoring
  tracesSampleRate: 1.0, // Capture 100% of the transactions
  // Session Replay
  replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
  replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
})

const logger = new Logger('main.tsx')

const studioTheme: BrandVariants = {
  10: '#030403',
  20: '#151A19',
  30: '#212C29',
  40: '#2A3934',
  50: '#324641',
  60: '#3B534D',
  70: '#45615A',
  80: '#4E7067',
  90: '#577E74',
  100: '#618D82',
  110: '#6B9C90',
  120: '#77AC9E',
  130: '#8DB9AD',
  140: '#A3C6BC',
  150: '#B8D4CC',
  160: '#CEE1DC',
}

const lightTheme = {
  ...createLightTheme(studioTheme),
}

const darkTheme = {
  ...createDarkTheme(studioTheme),
}

darkTheme.colorBrandForeground1 = studioTheme[110]
darkTheme.colorBrandForeground2 = studioTheme[120]

document.addEventListener('DOMContentLoaded', async () => {
  closeSplashScreen().catch(logger.error('closeSplashScreen'))
})

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <FluentProvider theme={lightTheme}>
      <div className="window">
        <App />
      </div>
    </FluentProvider>
  </React.StrictMode>,
)
