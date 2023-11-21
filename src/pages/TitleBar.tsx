import { appWindow } from '@tauri-apps/api/window'
import { useInterval } from 'usehooks-ts'
import { useState } from 'react'
import styles from './TitleBar.module.css'

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
    <div data-tauri-drag-region className={styles['title-bar']}>
      <div className={styles['left-widget']}>
        <span
          className={`${styles.icon} ${styles.back} icon ChromeBack ${backDisabled ? styles.disabled : ''}`}
          onClick={backClick}></span>
        <span className={`${styles.icon} ${styles.nav} icon GlobalNavButton`} onClick={navClick}></span>
        <span className={styles.title}>{windowTitle}</span>
      </div>
      <div className={styles['window-control']}>
        <span className={`${styles.icon} icon ChromeMinimize`} onClick={() => appWindow.minimize()}></span>
        <span
          className={`${styles.icon} icon ${maximized ? 'ChromeRestore' : 'ChromeMaximize'}`}
          onClick={maximized ? () => appWindow.unmaximize() : () => appWindow.maximize()}></span>
        <span className={`${styles.icon} ${styles.close} icon ChromeClose`} onClick={() => appWindow.close()}></span>
      </div>
    </div>
  )
}

export default TitleBar
