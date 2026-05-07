import { useLocale } from './LocaleProvider.jsx'

// useT — dictionary lookup hook.
//
// Usage:
//   const t = useT()
//   t('hero.headline_1')           // → "בית שמרגיש"
//   t('missing.key')               // → "missing.key" (keys leak in dev — fail loud)
//
// Why dotted-path lookup instead of flat keys: the dictionary stays
// readable as a tree, and keeps related strings grouped (hero.*, about.*).

export function useT() {
  const { dict } = useLocale()

  return (path) => {
    if (!path) return ''
    const parts = path.split('.')
    let node = dict
    for (const part of parts) {
      if (node == null || typeof node !== 'object') return path
      node = node[part]
    }
    return typeof node === 'string' ? node : path
  }
}
