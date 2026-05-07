import { useLocale } from '../../i18n/LocaleProvider.jsx'
import { useT } from '../../i18n/useT.js'

// LangToggle — single button that flips locale.
// Shows the *target* language (the one you'll switch to), not the current one.
// Pattern matches Apple, Vercel, Notion — less ambiguous than a dropdown for 2 locales.

export default function LangToggle() {
  const { locale, toggle } = useLocale()
  const t = useT()
  const targetLabel = locale === 'he' ? t('lang.toggle_to_en') : t('lang.toggle_to_he')
  const ariaLabel = locale === 'he' ? 'Switch to English' : 'החלף לעברית'

  return (
    <button
      type="button"
      className="lang-toggle"
      onClick={toggle}
      aria-label={ariaLabel}
    >
      {targetLabel}
    </button>
  )
}
