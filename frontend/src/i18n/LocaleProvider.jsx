import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import he from './he.json'
import en from './en.json'

// ── Lean DIY i18n ────────────────────────────────────────────────────────────
// Two locales, ~80 strings, no library. If we add a third locale or need
// pluralization beyond Intl, migrate to i18next.
// TODO(i18n): migrate to i18next when N>2 locales or pluralization is needed.

const DICTIONARIES = { he, en }
const STORAGE_KEY = 'vicky.locale'

const LocaleContext = createContext({
  locale: 'he',
  dir: 'rtl',
  dict: he,
  setLocale: () => {},
  toggle: () => {},
})

function pickInitialLocale() {
  // 1. Persisted preference wins
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'he' || stored === 'en') return stored
  } catch { /* localStorage may be blocked (private mode, SSR, etc.) */ }

  // 2. Fall back to navigator.language — Hebrew users see Hebrew automatically
  if (typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('en')) {
    return 'en'
  }

  // 3. Default to Hebrew (primary market)
  return 'he'
}

export function LocaleProvider({ children }) {
  const [locale, setLocaleState] = useState(pickInitialLocale)

  // Sync <html lang> and <html dir> imperatively. This is the only side effect
  // of changing locale — the rest is pure render.
  useEffect(() => {
    const dir = locale === 'he' ? 'rtl' : 'ltr'
    document.documentElement.setAttribute('lang', locale)
    document.documentElement.setAttribute('dir', dir)
  }, [locale])

  const setLocale = useCallback((next) => {
    if (next !== 'he' && next !== 'en') return
    setLocaleState(next)
    try { localStorage.setItem(STORAGE_KEY, next) } catch { /* ignore */ }
  }, [])

  const toggle = useCallback(() => {
    setLocale(locale === 'he' ? 'en' : 'he')
  }, [locale, setLocale])

  const value = useMemo(() => ({
    locale,
    dir: locale === 'he' ? 'rtl' : 'ltr',
    dict: DICTIONARIES[locale],
    setLocale,
    toggle,
  }), [locale, setLocale, toggle])

  return (
    <LocaleContext.Provider value={value}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale() {
  return useContext(LocaleContext)
}
