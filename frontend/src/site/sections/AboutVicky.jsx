import { useT } from '../../i18n/useT.js'

// AboutVicky — Havenly-inspired structure:
//  · centered eyebrow above the section
//  · two-column body: copy left, 3-photo collage right
//  · collage = 1 large left tile (portrait of Vicky) + 2 smaller stacked tiles
//
// Photo provenance
// ────────────────
//   tile-portrait → PH02/(10)  (Vicky at the showroom — the relationship shot)
//   tile-fabrics  → PH03/(7)   (folded magenta/orange textile stack — material)
//   tile-styling  → PH03/(9)   (travertine bench + flowing sheers — finished aesthetic)
//
// Together these tell a "selecting → materials → finished work" story. Swap
// the two right tiles when more "Vicky at work" photography is available.
//
// RTL note: CSS Grid columns mirror automatically when dir="rtl" is set on
// the document, so on Hebrew the copy moves to the right and the collage to
// the left without per-locale overrides.

const TILES = [
  {
    cls: 'about__tile--portrait',
    avif: '/assets/site/about/tile-portrait.avif',
    webp: '/assets/site/about/tile-portrait.webp',
    jpg:  '/assets/site/about/tile-portrait.jpg',
    altKey: 'about.image_alt',
    // Vicky's face is in the upper half of this frame; anchor higher.
    position: 'center 30%',
  },
  {
    cls: 'about__tile--fabrics',
    avif: '/assets/site/about/tile-fabrics.avif',
    webp: '/assets/site/about/tile-fabrics.webp',
    jpg:  '/assets/site/about/tile-fabrics.jpg',
    altKey: 'about.tile_fabrics_alt',
    // Source is portrait; centre crop to a square loses the hand. Anchor low
    // so the hand + folded stack stay visible.
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
    </section>
  )
}
