import { appWindow } from '@tauri-apps/api/window'
import { useInterval } from 'usehooks-ts'
import { useState } from 'react'
import './TitleBar.css'

interface TitleBarProps {
  backDisabled: boolean
  backClick: () => void
  navClick: () => void
}

const TitleBar = ({ backDisabled, backClick, navClick }: TitleBarProps) => {
  const [maximized, setMaximized] = useState(false)
  const [windowTitle, setWindowTitle] = useState('')

  useInterval(() => {
    appWindow.isMaximized().then(setMaximized)
    appWindow.title().then(setWindowTitle)
  }, 200)

  return (
    <div data-tauri-drag-region className="title-bar">
      <div className="left-widget">
        <span className={`icon ChromeBack ${backDisabled ? 'disabled' : ''}`} onClick={backClick}></span>
        <span className={`icon GlobalNavButton`} onClick={navClick}></span>
        <span className="title">{windowTitle}</span>
      </div>
      <div className="window-control">
        <span className="icon ChromeMinimize" onClick={() => appWindow.minimize()}></span>
        <span
          className={`icon ${maximized ? 'ChromeRestore' : 'ChromeMaximize'}`}
          onClick={maximized ? () => appWindow.unmaximize() : () => appWindow.maximize()}></span>
        <span className="icon ChromeClose" onClick={() => appWindow.close()}></span>
      </div>
    </div>
  )
}

export default TitleBar
