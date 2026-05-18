import { useState, useEffect } from 'react'
import { useT } from '../../i18n/useT.js'
import { API_BASE } from '../../api.js'

// AboutVicky — Havenly-inspired structure:
//  · centered eyebrow above the section
//  · two-column body: copy left, 3-photo collage right
//  · collage = 1 large left tile (portrait of Vicky) + 2 smaller stacked tiles
//  · horizontal scroll strip below — managed via admin panel
//
// Images are loaded dynamically from /site-images/config so Vicky can update
// them via the admin panel without a redeploy. Static paths below are the
// defaults used when no custom upload exists.

const TILE_DEFAULTS = {
  portrait: { webp: '/assets/site/about/tile-portrait.webp', jpg: '/assets/site/about/tile-portrait.jpg', avif: '/assets/site/about/tile-portrait.avif' },
  fabrics:  { webp: '/assets/site/about/tile-fabrics.webp',  jpg: '/assets/site/about/tile-fabrics.jpg',  avif: '/assets/site/about/tile-fabrics.avif'  },
  styling:  { webp: '/assets/site/about/tile-styling.webp',  jpg: '/assets/site/about/tile-styling.jpg',  avif: '/assets/site/about/tile-styling.avif'  },
}

const STRIP_DEFAULTS = [
  { src: '/assets/site/about/ph04-a.webp', alt: 'Vicky interior design work' },
  { src: '/assets/site/about/ph04-b.webp', alt: 'Curtain detail' },
  { src: '/assets/site/about/ph04-c.webp', alt: 'Fabric selection' },
  { src: '/assets/site/about/ph04-d.webp', alt: 'Design studio' },
]

const TILES_META = [
  { slot: 'portrait', cls: 'about__tile--portrait', altKey: 'about.image_alt',       position: 'center 30%'   },
  { slot: 'fabrics',  cls: 'about__tile--fabrics',  altKey: 'about.tile_fabrics_alt', position: 'center 75%'  },
  { slot: 'styling',  cls: 'about__tile--styling',  altKey: 'about.tile_styling_alt', position: 'center center'},
]

export default function AboutVicky() {
  const t = useT()
  const [imgCfg, setImgCfg] = useState(null)

  useEffect(() => {
    fetch(`${API_BASE}/site-images/config`)
      .then(r => r.ok ? r.json() : null)
      .catch(() => null)
      .then(cfg => { if (cfg) setImgCfg(cfg) })
  }, [])

  // Resolve a collage tile's src: use admin-uploaded URL if available, else static default
  const tileUrl = (slot, format) => {
    const custom = imgCfg?.collage?.[slot]
    if (custom) return custom   // Railway-hosted, format already baked in
    return TILE_DEFAULTS[slot][format]
  }

  // Combine default strip + any admin-added photos
  const strip = imgCfg?.strip?.length
    ? imgCfg.strip.map(s => ({ src: API_BASE + s.url, alt: s.alt }))
    : STRIP_DEFAULTS

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
            {TILES_META.map((tile) => {
              const custom = imgCfg?.collage?.[tile.slot]
              return (
                <figure key={tile.cls} className={`about__tile ${tile.cls}`}>
                  {custom ? (
                    <img
                      src={API_BASE + custom}
                      alt={t(tile.altKey)}
                      loading="lazy"
                      decoding="async"
                      style={{ objectPosition: tile.position }}
                    />
                  ) : (
                    <picture>
                      <source srcSet={tileUrl(tile.slot, 'avif')} type="image/avif" />
                      <source srcSet={tileUrl(tile.slot, 'webp')} type="image/webp" />
                      <img
                        src={tileUrl(tile.slot, 'jpg')}
                        alt={t(tile.altKey)}
                        loading="lazy"
                        decoding="async"
                        style={{ objectPosition: tile.position }}
                      />
                    </picture>
                  )}
                </figure>
              )
            })}
          </div>
        </div>
      </div>

      {/* Horizontal scroll strip */}
      <div className="about__strip-wrap" aria-label="More photos">
        <ul className="about__strip" role="list">
          {strip.map((photo, i) => (
            <li key={i} className="about__strip-item">
              <img src={photo.src} alt={photo.alt} loading="lazy" decoding="async" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
