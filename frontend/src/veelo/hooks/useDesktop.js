// ── useDesktop ────────────────────────────────────────────────────────────────
// Returns true when the viewport is ≥ the given breakpoint (default 768px).
// Uses matchMedia so it updates on resize without polling.

import { useState, useEffect } from 'react'

export function useDesktop(breakpoint = 768) {
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.innerWidth >= breakpoint
  )

  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${breakpoint}px)`)
    const handler = (e) => setIsDesktop(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [breakpoint])

  return isDesktop
}
