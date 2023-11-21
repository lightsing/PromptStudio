import styles from './About.module.css'
import meta from '../../package.json'
import { useTranslation } from 'react-i18next'
import License from './License.tsx'

const About = () => {
  const { t } = useTranslation()
  return (
    <div className={styles.root}>
      <h1 className={styles.title}>{t('Page.About')}</h1>
      <div className={styles.about}>
        <div className={styles['info-group']}>
          <div className={styles['info-group-header']}>
            <span className="icon Info"></span>
            <span className={styles.title}>{t('SoftwareInfo')}</span>
          </div>
          <div className={styles.info}>
            <div>
              <span className={styles.title}>{t('Version')}</span>
            </div>
            <div>
              <span>{meta.version}</span>
            </div>
          </div>
        </div>
        <div className={styles['info-group']}>
          <div className={styles['info-group-header']}>
            <span className="icon PenPalette"></span>
            <span className={styles.title}>{t('License')}</span>
          </div>
          <div className={styles.license}>
            <License />
          </div>
        </div>
      </div>
    </div>
  )
}

export default About
