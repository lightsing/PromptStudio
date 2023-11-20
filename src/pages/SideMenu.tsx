import './SideMenu.css'

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
  return (
    <div className={`side-menu ${open ? 'open' : ''}`}>
      <div className="buttons">
        {buttons.map((e) => (
          <div className="button" onClick={e.onClick} key={e.text}>
            <div className="icon-wrapper">
              <span className={`icon ${e.icon}`}></span>
            </div>
            <div className="text-wrapper">
              <span className="text">{e.text}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="pages">
        {pages.map((e) => (
          <div
            key={e.text}
            className={`page ${e.page === activePage ? 'active' : ''}`}
            onClick={e.page === activePage ? undefined : () => onClick(e.page)}>
            <div className="icon-wrapper">
              <span className={`icon ${e.icon}`}></span>
            </div>
            <div className="text-wrapper">
              <span className="text">{e.text}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default SideMenu
