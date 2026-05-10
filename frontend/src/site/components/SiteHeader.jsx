import { Link } from 'react-router-dom'
import { useT } from '../../i18n/useT.js'
import LangToggle from './LangToggle.jsx'

// SiteHeader — sticky, translucent over the hero, hardens on scroll naturally
// because the body scrolls under it.

export default function SiteHeader() {
  const t = useT()

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link to="/" className="site-header__logo" aria-label="Vicky Israel — home">
          <img
            src="/logo.png"
            alt="Vicky Israel · Textile & Design Studio"
            style={{ height: 40, width: 'auto', display: 'block' }}
          />
        </Link>

        <nav className="site-header__nav" aria-label="Primary">
          <a href="#about">{t('nav.about')}</a>
          <a href="#veelo-teaser">{t('nav.veelo')}</a>
          <a href="#contact">{t('nav.contact')}</a>
        </nav>

        <div className="site-header__right">
          <LangToggle />
        </div>
      </div>
    </header>
  )
}
