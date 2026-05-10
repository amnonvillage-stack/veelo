import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useT } from '../../i18n/useT.js'
import { useLocale } from '../../i18n/LocaleProvider.jsx'
import LangToggle from './LangToggle.jsx'

// SiteHeader — sticky, translucent over the hero, hardens on scroll naturally
// because the body scrolls under it.

function HamburgerIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="6"  x2="21" y2="6"  />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6"  x2="6"  y2="18" />
      <line x1="6"  y1="6"  x2="18" y2="18" />
    </svg>
  )
}

export default function SiteHeader() {
  const t = useT()
  const { locale, toggle } = useLocale()
  const [menuOpen, setMenuOpen] = useState(false)

  const NAV = [
    { label: t('nav.about'),   href: '#about'        },
    { label: t('nav.veelo'),   href: '#veelo-teaser' },
    { label: t('nav.contact'), href: '#contact'      },
  ]

  const close = () => setMenuOpen(false)

  return (
    <>
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
            {NAV.map(n => <a key={n.href} href={n.href}>{n.label}</a>)}
          </nav>

          <div className="site-header__right">
            <LangToggle />
            {/* Hamburger — mobile only, hidden ≥768px via CSS */}
            <button
              className="site-header__burger"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              aria-expanded={menuOpen}
            >
              <HamburgerIcon />
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile drawer ───────────────────────────────────────────────────── */}
      {menuOpen && (
        <div className={`site-mobile-menu${menuOpen ? ' is-open' : ''}`}>
          {/* Backdrop */}
          <div className="site-mobile-menu__backdrop" onClick={close} />

          {/* Panel */}
          <div className="site-mobile-menu__panel">
            {/* Top row: logo + close */}
            <div className="site-mobile-menu__header">
              <img src="/logo.png" alt="Vicky Israel" style={{ height: 36, width: 'auto' }} />
              <button className="site-mobile-menu__close" onClick={close} aria-label="Close menu">
                <CloseIcon />
              </button>
            </div>

            {/* Nav links */}
            <nav className="site-mobile-menu__nav">
              {NAV.map((n, i) => (
                <a
                  key={n.href}
                  href={n.href}
                  onClick={close}
                  style={{ animationDelay: `${0.06 + i * 0.05}s` }}
                >
                  <span>{n.label}</span>
                  <span className="site-mobile-menu__arrow">→</span>
                </a>
              ))}
            </nav>

            {/* Footer: language toggle */}
            <div className="site-mobile-menu__footer">
              <span className="site-mobile-menu__lang-hint">
                {locale === 'he' ? 'Switch to English' : 'עברית'}
              </span>
              <button
                className="site-mobile-menu__lang-btn"
                onClick={() => { toggle(); close() }}
              >
                {locale === 'he' ? t('lang.toggle_to_en') : t('lang.toggle_to_he')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
