// ── MobileMenu ────────────────────────────────────────────────────────────────
// Slide-down drawer for mobile navigation.
// Triggered by the hamburger button in the Capture header.
// Links back to the Vicky Israel marketing site sections.
// Includes language toggle.

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useT } from '../../i18n/useT.js'
import { useLocale } from '../../i18n/LocaleProvider.jsx'
import { IconX } from './icons.jsx'

const NAV_ITEMS = [
  { key: 'about',   hash: '#about'   },
  { key: 'studio',  hash: '#studio'  },
  { key: 'veelo',   hash: '#veelo'   },
  { key: 'contact', hash: '#contact' },
]

export default function MobileMenu({ isOpen, onClose }) {
  const navigate = useNavigate()
  const t        = useT()
  const { locale, toggle } = useLocale()

  // Lock body scroll while open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  const go = (hash) => {
    onClose()
    navigate('/' + hash)
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 300,
      display: 'flex',
      flexDirection: 'column',
    }}>
      <style>{`
        @keyframes menu-backdrop { from { opacity: 0 } to { opacity: 1 } }
        @keyframes menu-slide    { from { transform: translateY(-100%) } to { transform: translateY(0) } }
        @keyframes menu-fade-in  { from { opacity: 0; transform: translateY(-8px) } to { opacity: 1; transform: translateY(0) } }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute', inset: 0,
          background: 'rgba(26,22,16,0.45)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          animation: 'menu-backdrop 0.22s ease both',
        }}
      />

      {/* Drawer panel */}
      <div style={{
        position: 'relative',
        background: 'var(--bg)',
        borderBottom: '1px solid var(--border)',
        animation: 'menu-slide 0.28s var(--ease-out) both',
        display: 'flex',
        flexDirection: 'column',
      }}>

        {/* Top row: logo + close */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 20px 16px',
          borderBottom: '1px solid var(--border)',
        }}>
          <img
            src="/logo.png"
            alt="Vicky Israel"
            style={{ height: 40, width: 'auto' }}
          />
          <button
            onClick={onClose}
            aria-label="Close menu"
            style={{
              width: 36, height: 36,
              borderRadius: 'var(--r-sm)',
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--ink)', cursor: 'pointer',
              transition: 'background var(--duration)',
            }}
          >
            <IconX size={18} />
          </button>
        </div>

        {/* Nav links */}
        <nav style={{ padding: '8px 0' }}>
          {NAV_ITEMS.map((item, i) => (
            <button
              key={item.key}
              onClick={() => go(item.hash)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 24px',
                background: 'none',
                border: 'none',
                borderBottom: i < NAV_ITEMS.length - 1 ? '1px solid var(--border)' : 'none',
                cursor: 'pointer',
                textAlign: 'start',
                animation: `menu-fade-in 0.3s ${0.06 + i * 0.05}s var(--ease-out) both`,
              }}
            >
              <span style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.25rem',
                fontWeight: 400,
                color: 'var(--ink)',
                letterSpacing: '-0.01em',
              }}>
                {t(`nav.${item.key}`)}
              </span>
              <span style={{
                fontSize: '1rem',
                color: 'var(--text-4)',
                lineHeight: 1,
              }}>
                →
              </span>
            </button>
          ))}
        </nav>

        {/* Footer: language toggle */}
        <div style={{
          padding: '14px 24px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 8,
          borderTop: '1px solid var(--border)',
          animation: `menu-fade-in 0.3s 0.28s var(--ease-out) both`,
        }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-3)', fontWeight: 500 }}>
            {locale === 'he' ? 'English' : 'עברית'}
          </span>
          <button
            onClick={() => { toggle(); onClose() }}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--r-full)',
              background: 'var(--surface-ink)',
              color: 'var(--text-on-ink)',
              border: 'none',
              fontSize: '0.72rem',
              fontWeight: 700,
              letterSpacing: '0.06em',
              cursor: 'pointer',
              transition: 'opacity var(--duration)',
            }}
          >
            {locale === 'he' ? t('lang.toggle_to_en') : t('lang.toggle_to_he')}
          </button>
        </div>
      </div>
    </div>
  )
}
