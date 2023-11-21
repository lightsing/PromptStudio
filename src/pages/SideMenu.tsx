import styles from './SideMenu.module.css'
import { useTranslation } from 'react-i18next'

interface SideMenuButtons {
  icon: string
  text: string
  onClick: () => void
}

interface SideMenuPages {
  page: string
  icon: string
  text: string
}

interface SideMenuProps {
  buttons: SideMenuButtons[]
  pages: SideMenuPages[]
  activePage: string
  open: boolean
  onClick: (page: string) => void
}
const SideMenu = ({ buttons, pages, activePage, open, onClick }: SideMenuProps) => {
  const { t } = useTranslation()
  return (
    <div className={`${styles.side} ${open ? styles.open : ''}`}>
      <div className={styles.buttons}>
        {buttons.map((e) => (
          <div className={styles.button} onClick={e.onClick} key={e.text}>
            <div className={styles['icon-wrapper']}>
              <span className={`icon ${e.icon}`}></span>
            </div>
            <div className={styles['text-wrapper']}>
              <span>{e.text}</span>
            </div>
          </div>
        ))}
      </div>
      <div className={`${styles.pages} ${styles.center}`}>
        {pages.map((e) => (
          <div
            key={e.text}
            className={`${styles.page} ${e.page === activePage ? styles.active : ''}`}
            onClick={e.page === activePage ? undefined : () => onClick(e.page)}>
            <div className={styles['icon-wrapper']}>
              <span className={`icon ${e.icon}`}></span>
            </div>
            <div className={styles['text-wrapper']}>
              <span>{e.text}</span>
            </div>
          </div>
        ))}
      </div>
      <div className={`${styles.pages} ${styles.bottom}`}>
        <div
          className={`${styles.page} ${'about' === activePage ? 'active' : ''}`}
          onClick={'about' === activePage ? undefined : () => onClick('about')}>
          <div className={styles['icon-wrapper']}>
            <span className="icon Info"></span>
          </div>
          <div className={styles['text-wrapper']}>
            <span>{t('Page.About')}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SideMenu
