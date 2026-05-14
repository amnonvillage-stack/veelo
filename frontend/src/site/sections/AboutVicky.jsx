import { useT } from '../../i18n/useT.js'

// AboutVicky — Havenly-inspired structure:
//  · centered eyebrow above the section
//  · two-column body: copy left, 3-photo collage right
//  · collage = 1 large left tile (portrait of Vicky) + 2 smaller stacked tiles
//  · horizontal scroll strip below — PH04 photos (snap-scroll, fade edges)
//
// Photo provenance
// ────────────────
//   tile-portrait → PH02/(10)  (Vicky at the showroom — the relationship shot)
//   tile-fabrics  → PH03/(7)   (folded magenta/orange textile stack — material)
//   tile-styling  → PH03/(9)   (travertine bench + flowing sheers — finished aesthetic)
//   strip photos  → PH04       (4 additional work/space photos)
//
// RTL note: CSS Grid columns mirror automatically when dir="rtl" is set on
// the document, so on Hebrew the copy moves to the right and the collage to
// the left without per-locale overrides. The scroll strip direction follows
// the document writing direction via CSS logical properties.

const TILES = [
  {
    cls: 'about__tile--portrait',
    avif: '/assets/site/about/tile-portrait.avif',
    webp: '/assets/site/about/tile-portrait.webp',
    jpg:  '/assets/site/about/tile-portrait.jpg',
    altKey: 'about.image_alt',
    position: 'center 30%',
  },
  {
    cls: 'about__tile--fabrics',
    avif: '/assets/site/about/tile-fabrics.avif',
    webp: '/assets/site/about/tile-fabrics.webp',
    jpg:  '/assets/site/about/tile-fabrics.jpg',
    altKey: 'about.tile_fabrics_alt',
    position: 'center 75%',
  },
  {
    cls: 'about__tile--styling',
    avif: '/assets/site/about/tile-styling.avif',
    webp: '/assets/site/about/tile-styling.webp',
    jpg:  '/assets/site/about/tile-styling.jpg',
    altKey: 'about.tile_styling_alt',
    position: 'center center',
  },
]

// PH04 horizontal strip — add / remove entries freely; layout adapts.
const STRIP = [
  { src: '/assets/site/about/ph04-a.webp', alt: 'Vicky interior design work' },
  { src: '/assets/site/about/ph04-b.webp', alt: 'Curtain detail' },
  { src: '/assets/site/about/ph04-c.webp', alt: 'Fabric selection' },
  { src: '/assets/site/about/ph04-d.webp', alt: 'Design studio' },
]

export default function AboutVicky() {
  const t = useT()

  return (
    <section className="about section" id="about">
      <div className="container">
        <p className="eyebrow about__eyebrow">{t('about.eyebrow')}</p>

        <div className="about__grid">
          <div className="about__copy">
            <h2 className="display-2">{t('about.headline')}</h2>
            <p className="body">{t('about.body_1')}</p>
            <p className="body">{t('about.body_2')}</p>
            <p className="signature">{t('about.signature')}</p>
          </div>

          <div className="about__collage" role="group" aria-label={t('about.image_alt')}>
            {TILES.map((tile) => (
              <figure key={tile.cls} className={`about__tile ${tile.cls}`}>
                <picture>
                  <source srcSet={tile.avif} type="image/avif" />
                  <source srcSet={tile.webp} type="image/webp" />
                  <img
                    src={tile.jpg}
                    alt={t(tile.altKey)}
                    loading="lazy"
                    decoding="async"
                    style={{ objectPosition: tile.position }}
                  />
                </picture>
              </figure>
            ))}
          </div>
        </div>
      </div>

      {/* Horizontal scroll strip — bleeds edge-to-edge, independent of .container */}
      <div className="about__strip-wrap" aria-label="More photos">
        <ul className="about__strip" role="list">
          {STRIP.map((photo, i) => (
            <li key={i} className="about__strip-item">
              <img
                src={photo.src}
                alt={photo.alt}
                loading="lazy"
                decoding="async"
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
