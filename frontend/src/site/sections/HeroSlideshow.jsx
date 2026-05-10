import { useEffect, useState, useRef } from 'react'

// HeroSlideshow — slow editorial crossfade between 3 photographs of Vicky's
// installations. Each slide drifts (Ken-Burns: ~6% scale, gentle pan) while
// it's active so the hero never feels static.
//
// Behaviour
// ─────────
//  · One slide is "active" at a time; the next one fades in over 1.6s while the
//    previous one fades out → gives the feeling of light passing across the room.
//  · Active slide drifts via CSS keyframes (transform-origin alternates per
//    slide for variety). Drift is GPU-cheap (transform + opacity only).
//  · Honours prefers-reduced-motion — pins the first slide, kills timer,
//    cancels Ken-Burns. Critical for users with vestibular sensitivity.
//  · Pauses when the document is hidden (tab in background, screen off) so we
//    don't burn cycles or wake the GPU on a non-visible page.
//
// Asset trade-off
// ──────────────
// All slides use eager fetchpriority on the FIRST one only; slides 2 and 3
// load lazily (loading="lazy" on the <img>). The total AVIF payload for all
// three is ~190KB so the lazy slides pop in well before the first crossfade
// at 7s — no flash of unloaded image.

const SLIDES = [
  {
    avif: '/assets/site/hero/slides/slide-1.avif',
    webp: '/assets/site/hero/slides/slide-1.webp',
    jpg:  '/assets/site/hero/slides/slide-1.jpg',
    alt_he: 'סלון מואר עם וילונות שיפון תלויים מהתקרה לרצפה על שלושה חלונות מקושתים',
    alt_en: 'Bright living room with floor-to-ceiling sheer curtains across three arched windows',
    // object-position 30%/center — windows + sheers + sofa anchored.
    position: 'center 30%',
    // Ken-Burns origin: drift outward from upper-center (eye to windows).
    origin: '50% 35%',
  },
  {
    avif: '/assets/site/hero/slides/slide-2.avif',
    webp: '/assets/site/hero/slides/slide-2.webp',
    jpg:  '/assets/site/hero/slides/slide-2.jpg',
    alt_he: 'וילונות שיפון על קיר זכוכית מלא עם שתי כורסאות קטיפה',
    alt_en: 'Sheer curtains across a full glass wall with two velvet armchairs',
    position: 'center 50%',
    origin: '40% 60%',  // drift toward the armchairs
  },
  {
    avif: '/assets/site/hero/slides/slide-3.avif',
    webp: '/assets/site/hero/slides/slide-3.webp',
    jpg:  '/assets/site/hero/slides/slide-3.jpg',
    alt_he: 'סלון עם וילונות אנכיים ונוף לגינה',
    alt_en: 'Living room with vertical sheer panels overlooking a garden',
    position: 'center 45%',
    origin: '60% 50%',
  },
]

// Total time on each slide BEFORE we begin fading to the next one.
// Crossfade duration is set in CSS (.hero__slide transition).
const HOLD_MS = 7000

export default function HeroSlideshow({ locale = 'en' }) {
  const [active, setActive] = useState(0)
  const reducedMotion = useReducedMotion()
  const intervalRef = useRef(null)

  useEffect(() => {
    if (reducedMotion) return // pin slide-1, no rotation

    const tick = () => setActive((i) => (i + 1) % SLIDES.length)

    // Pause/resume on visibility change so we don't drift while the tab is hidden.
    let timer = null
    const start = () => {
      if (timer == null) timer = setInterval(tick, HOLD_MS)
    }
    const stop = () => {
      if (timer != null) { clearInterval(timer); timer = null }
    }
    const onVis = () => (document.hidden ? stop() : start())

    start()
    document.addEventListener('visibilitychange', onVis)
    return () => {
      stop()
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [reducedMotion])

  return (
    <div className="hero__slideshow" aria-roledescription="slideshow">
      {SLIDES.map((slide, i) => {
        const isActive = i === active
        const alt = locale === 'he' ? slide.alt_he : slide.alt_en
        return (
          <picture
            key={i}
            className={`hero__slide${isActive ? ' is-active' : ''}`}
            style={{ transformOrigin: slide.origin }}
            aria-hidden={!isActive}
          >
            <source srcSet={slide.avif} type="image/avif" />
            <source srcSet={slide.webp} type="image/webp" />
            <img
              src={slide.jpg}
              // First slide is the LCP candidate — fetch eager, others lazy.
              alt={i === 0 ? alt : ''}
              loading={i === 0 ? 'eager' : 'lazy'}
              fetchpriority={i === 0 ? 'high' : 'auto'}
              decoding="async"
              style={{ objectPosition: slide.position }}
            />
          </picture>
        )
      })}
    </div>
  )
}

// Hook — listens to (prefers-reduced-motion: reduce). Pure JS, no library.
function useReducedMotion() {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const listener = (e) => setReduced(e.matches)
    mq.addEventListener?.('change', listener)
    return () => mq.removeEventListener?.('change', listener)
  }, [])
  return reduced
}
