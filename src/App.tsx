import { useEffect, useState } from 'react'
import TitleBar from './pages/TitleBar.tsx'
import SideMenu from './pages/SideMenu.tsx'
import './App.css'
import Editor from './pages/Editor.tsx'
import Settings from './pages/Settings.tsx'
import { useTranslation } from 'react-i18next'
import History from './pages/History.tsx'
import { createChatConfig } from './utils/command.ts'
import { Logger } from './utils/log.ts'
import { useAvailableModels } from './utils/hooks.ts'
import About from './pages/About.tsx'

const logger = new Logger('App.tsx')

const App = () => {
  const { t } = useTranslation()
  const [backHistory, setBackHistory] = useState<string[]>(['editor'])
  const [sideMenuOpen, setSideMenuOpen] = useState(false)
  const [activePage, setActivePageInner] = useState('editor')
  const [currentChatUUID, setCurrentChatUUID] = useState<string | null>(null)
  const { models, errorModels, isModelsLoading } = useAvailableModels()

  useEffect(() => {
    if (isModelsLoading) {
      return
    }
    if (errorModels || !models) {
      setActivePage('settings')
    }
  }, [models, errorModels, isModelsLoading])

  useEffect(() => {
    const init = async () => {
      const config = await createChatConfig()
      setCurrentChatUUID(config.uuid)
    }
    if (currentChatUUID === null) {
      init().catch(logger.error('init'))
    }
  }, [currentChatUUID])

  const setActivePage = (page: string) => {
    setActivePageInner(page)
    if (page === 'editor') {
      setBackHistory(['editor'])
    } else {
      setBackHistory((e) => [...e, page])
    }
  }

  return (
    <div className="main">
      <TitleBar
        backDisabled={backHistory.length === 1}
        backClick={() => {
          if (backHistory.length > 1) {
            setActivePageInner(backHistory[backHistory.length - 2])
            setBackHistory((e) => e.slice(0, e.length - 1))
            setSideMenuOpen(false)
          }
        }}
        navClick={() => setSideMenuOpen((e) => !e)}
      />
      <div className="container">
        <SideMenu
          buttons={[
            {
              icon: 'Add',
              text: t('New'),
              onClick: () => {
                const callback = async () => {
                  const config = await createChatConfig()
                  setCurrentChatUUID(config.uuid)
                  setSideMenuOpen(false)
                }
                callback().catch(logger.error('Add'))
              },
            },
          ]}
          pages={[
            {
              page: 'editor',
              icon: 'Edit',
              text: t('Page.Editor'),
            },
            {
              page: 'history',
              icon: 'History',
              text: t('Page.History'),
            },
            {
              page: 'settings',
              icon: 'Settings',
              text: t('Page.Settings'),
            },
          ]}
          activePage={activePage}
          open={sideMenuOpen}
          onClick={(page) => {
            setActivePage(page)
            setSideMenuOpen(false)
          }}
        />
        <div className="content">
          {activePage === 'editor' && currentChatUUID !== null && <Editor uuid={currentChatUUID} />}
          {activePage === 'history' && currentChatUUID !== null && (
            <History setCurrentChatUUID={setCurrentChatUUID} setActivePage={setActivePage} />
          )}
          {activePage === 'settings' && <Settings />}
          {activePage === 'about' && <About />}
        </div>
      </div>
    </div>
  )
}

export default App
