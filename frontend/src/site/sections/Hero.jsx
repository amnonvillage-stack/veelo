import { Link } from 'react-router-dom'
import { useT } from '../../i18n/useT.js'
import { useLocale } from '../../i18n/LocaleProvider.jsx'
import HeroSlideshow from './HeroSlideshow.jsx'

// Hero — full-bleed photo slideshow + gradient overlay + content anchored
// bottom-start.
//
// Image strategy
// ──────────────
// The hero rotates between three of Vicky's installation photographs via
// <HeroSlideshow/> (crossfade + Ken-Burns drift). Slides live at
// /assets/site/hero/slides/slide-{1..3}.{avif,webp,jpg}.
//
// The HeroIllustration SVG below is kept as a defence-in-depth fallback —
// it sits at z-index: -3 behind the slideshow. If every slide fails to load,
// the SVG is what shows. Cheap insurance (~3KB inline).

export default function Hero() {
  const t = useT()
  const { locale } = useLocale()

  return (
    <section className="hero" id="top">
      {/* Layer 1 — defence-in-depth editorial illustration (rarely seen) */}
      <HeroIllustration />

      {/* Layer 2 — the photo slideshow */}
      <HeroSlideshow locale={locale} />

      {/* Bottom-up dark wash for headline contrast */}
      <div className="hero__overlay" aria-hidden="true" />

      <div className="container hero__content">
        <p className="hero__eyebrow">{t('hero.eyebrow')}</p>
        <h1 className="display-1">
          {t('hero.headline_1')}
          <br />
          <em className="display-italic">{t('hero.headline_2')}</em>
        </h1>
        <p className="hero__lede">{t('hero.lede')}</p>
        <div className="hero__cta-row">
          <a href="#contact" className="btn btn-on-dark">{t('hero.cta_primary')}</a>
          <a href="#about" className="btn btn-ghost-on-dark">{t('hero.cta_secondary')}</a>
          <Link to="/veelo" className="btn btn-veelo-cta">
            <SparkleIcon />
            {t('hero.cta_veelo')}
          </Link>
        </div>
      </div>
    </section>
  )
}

// ── SparkleIcon ───────────────────────────────────────────────────────────────
// 4-point star used inside the Veelo CTA button. Inline SVG keeps it
// pixel-sharp at any size without an extra network request.
function SparkleIcon() {
  return (
    <svg
      width="15" height="15" viewBox="0 0 20 20"
      fill="currentColor" aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <path d="M10 0 L11.8 8.2 L20 10 L11.8 11.8 L10 20 L8.2 11.8 L0 10 L8.2 8.2 Z" />
    </svg>
  )
}

// ── HeroIllustration ─────────────────────────────────────────────────────────
// Abstract editorial backdrop kept as a last-resort fallback under the photo
// slideshow. Pure SVG so it's bytes-free at the network layer and stays crisp.
function HeroIllustration() {
  return (
    <svg
      className="hero__illustration"
      viewBox="0 0 1200 800"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      role="presentation"
    >
      <defs>
        <linearGradient id="hero-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#2a1d14" />
          <stop offset="40%"  stopColor="#5a3e2a" />
          <stop offset="72%"  stopColor="#a05838" />
          <stop offset="92%"  stopColor="#d99464" />
          <stop offset="100%" stopColor="#f0c89c" />
        </linearGradient>
        <radialGradient id="hero-window" cx="50%" cy="60%" r="65%">
          <stop offset="0%"   stopColor="#fff2dc" stopOpacity="0.85" />
          <stop offset="55%"  stopColor="#ffd9a8" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#c07050" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="hero-curtain" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#faf6f0" stopOpacity="0.22" />
          <stop offset="55%"  stopColor="#faf6f0" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#faf6f0" stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect width="1200" height="800" fill="url(#hero-sky)" />
      <g>
        <path d="M 130 360 Q 130 200 280 200 Q 430 200 430 360 L 430 640 L 130 640 Z" fill="url(#hero-window)" />
        <path d="M 470 320 Q 470 150 600 150 Q 730 150 730 320 L 730 640 L 470 640 Z" fill="url(#hero-window)" />
        <path d="M 770 360 Q 770 200 920 200 Q 1070 200 1070 360 L 1070 640 L 770 640 Z" fill="url(#hero-window)" />
      </g>
      <g>
        <rect x="0"    y="0" width="135" height="800" fill="url(#hero-curtain)" />
        <rect x="245"  y="0" width="130" height="800" fill="url(#hero-curtain)" opacity="0.7" />
        <rect x="500"  y="0" width="125" height="800" fill="url(#hero-curtain)" opacity="0.7" />
        <rect x="755"  y="0" width="130" height="800" fill="url(#hero-curtain)" opacity="0.7" />
        <rect x="1020" y="0" width="135" height="800" fill="url(#hero-curtain)" opacity="0.9" />
      </g>
      <rect x="0" y="640" width="1200" height="160" fill="#1a1610" opacity="0.32" />
    </svg>
  )
}
