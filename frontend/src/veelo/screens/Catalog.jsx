// ── Catalog — Choose Fabric ───────────────────────────────────────────────────
// Havenly-inspired fabric selection grid.
// Supports multi-select (up to 4), type filter chips, and text search.

import { useState, useEffect } from 'react'
import TopBar    from '../components/TopBar.jsx'
import BottomNav from '../components/BottomNav.jsx'
import MobileMenu from '../components/MobileMenu.jsx'
import { useDesktop } from '../hooks/useDesktop.js'
import { useT } from '../../i18n/useT.js'
import { apiFetch, API_BASE } from '../../api.js'
import { IconSearch, IconX, IconCheck, IconScissors, IconSparkles } from '../components/icons.jsx'

const DENSITY_KEYS = ['sheer', 'light', 'medium', 'heavy', 'blackout']
const TYPE_FILTER_VALUES = ['', 'pleated', 'eyelet', 'roman', 'roller']

// CSS gradient fallbacks when a swatch image is absent
const SWATCH_COLORS = {
  '#d4c8a8': 'repeating-linear-gradient(0deg,rgba(180,160,120,.2) 0,rgba(180,160,120,.2) 1px,transparent 1px,transparent 7px),repeating-linear-gradient(90deg,rgba(180,160,120,.2) 0,rgba(180,160,120,.2) 1px,transparent 1px,transparent 7px),#d4c8a8',
  '#3d1f60': 'radial-gradient(ellipse at 35% 35%,#7b5ea0,#3d1f60)',
  '#1e2f60': 'linear-gradient(160deg,#1e2f60,#0e1830)',
  '#f0ecff': 'linear-gradient(135deg,#f0ecff,#e8f4ff,#f0ecff)',
  '#c86050': 'linear-gradient(135deg,#c86050,#a04030)',
  '#e2d4c2': 'repeating-linear-gradient(45deg,rgba(255,255,255,.2) 0,rgba(255,255,255,.2) 2px,transparent 2px,transparent 8px),#e2d4c2',
  '#7a9e7e': 'repeating-linear-gradient(135deg,rgba(255,255,255,.1) 0,rgba(255,255,255,.1) 2px,transparent 2px,transparent 6px),#7a9e7e',
  '#f8f4ee': 'linear-gradient(135deg,#f8f4ee,#f0ece4)',
  '#3a3a3a': 'repeating-linear-gradient(135deg,rgba(255,255,255,.05) 0,rgba(255,255,255,.05) 2px,transparent 2px,transparent 5px),#3a3a3a',
  '#d4a0a0': 'linear-gradient(135deg,#d4a0a0,#c08888)',
  '#405020': 'repeating-linear-gradient(135deg,rgba(255,255,255,.08) 0,rgba(255,255,255,.08) 2px,transparent 2px,transparent 6px),#405020',
  '#d8c8a0': 'linear-gradient(135deg,#d8c8a0,#c8b888)',
  '#5a5a5a': 'linear-gradient(135deg,#6a6a6a,#484848)',
  '#888888': 'linear-gradient(135deg,#a0a0a0,#707070)',
  '#e9e0d6': 'linear-gradient(135deg,#e9e0d6,#d8cfc5)',
}

// ── Swatch background with gradient fallback ──────────────────────────────────
function SwatchBg({ hex, style }) {
  return (
    <div style={{
      background: SWATCH_COLORS[hex] || hex,
      ...style,
    }} />
  )
}

// ── Skeleton card (loading shimmer) ──────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-md)',
      overflow: 'hidden',
    }}>
      <div style={{
        height: 130,
        background: 'linear-gradient(90deg, var(--surface-2) 25%, var(--surface-3) 50%, var(--surface-2) 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s ease infinite',
      }} />
      <div style={{ padding: '10px 12px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ height: 8,  borderRadius: 4, background: 'var(--surface-3)', width: '55%' }} />
        <div style={{ height: 14, borderRadius: 4, background: 'var(--surface-3)' }} />
        <div style={{ height: 10, borderRadius: 4, background: 'var(--surface-3)', width: '38%' }} />
      </div>
    </div>
  )
}

// ── Fabric card ───────────────────────────────────────────────────────────────
function FabricCard({ product, selected, onToggle }) {
  const [imgError, setImgError] = useState(false)
  const t = useT()

  return (
    <div
      onClick={() => onToggle(product)}
      style={{
        background: 'var(--surface)',
        border: selected ? '2px solid var(--accent)' : '1px solid var(--border)',
        borderRadius: 'var(--r-md)',
        overflow: 'hidden',
        cursor: 'pointer',
        position: 'relative',
        boxShadow: selected ? '0 0 0 3px var(--accent-glow)' : 'var(--shadow-sm)',
        transition: 'border-color var(--duration), box-shadow var(--duration), transform 0.15s var(--ease)',
        transform: selected ? 'translateY(-1px)' : 'none',
      }}
    >
      {/* Swatch */}
      <div style={{ position: 'relative', height: 130 }}>
        <SwatchBg hex={product.color_hex} style={{ position: 'absolute', inset: 0 }} />
        {product.swatch_path && !imgError && (
          <img
            src={`${API_BASE}${product.swatch_path}`}
            alt={product.name}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            onError={() => setImgError(true)}
          />
        )}

        {/* Selected checkmark */}
        {selected && (
          <div style={{
            position: 'absolute', top: 8, right: 8,
            width: 24, height: 24, borderRadius: '50%',
            background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 2px 8px rgba(192,112,80,.45)',
          }}>
            <IconCheck size={12} strokeWidth={3} />
          </div>
        )}

        {/* Out-of-stock badge */}
        {!product.in_stock && (
          <div style={{
            position: 'absolute', bottom: 7, left: 7,
            fontSize: '0.5rem', fontWeight: 700, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: '#fff',
            background: 'rgba(26,22,16,.72)', borderRadius: 'var(--r-xs)',
            padding: '3px 7px',
          }}>
            {t('app.catalog.out_of_stock')}
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '9px 11px 12px' }}>
        <div style={{
          fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: selected ? 'var(--accent)' : 'var(--brand-bronze)',
          marginBottom: 3,
        }}>
          {product.collection} · {product.type}
        </div>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.05rem', fontWeight: 500,
          color: 'var(--ink)', lineHeight: 1.15,
          marginBottom: 5,
        }}>
          {product.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: selected ? 'var(--accent)' : 'var(--ink)' }}>
            ₪{product.price_per_m}
            <span style={{ fontWeight: 400, color: 'var(--text-3)', fontSize: '0.6rem' }}> / m</span>
          </span>
          <span style={{
            fontSize: '0.52rem', fontWeight: 600, letterSpacing: '0.08em',
            textTransform: 'uppercase', color: 'var(--text-3)',
            background: 'var(--surface-2)', padding: '2px 7px',
            borderRadius: 'var(--r-full)',
          }}>
            {t(`app.catalog.${product.density}`)}
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Screen ────────────────────────────────────────────────────────────────────
export default function Catalog({ curtainType, onBack, onGenerate }) {
  const [products, setProducts] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState(curtainType || '')
  const [search,   setSearch]   = useState('')
  const [selected, setSelected] = useState([])
  const [menuOpen, setMenuOpen] = useState(false)
  const isDesktop = useDesktop()
  const t = useT()

  const TYPE_FILTERS = TYPE_FILTER_VALUES.map(v => ({
    value: v,
    label: v === '' ? t('app.catalog.filter_all') : t(`app.catalog.${v}`),
  }))

  useEffect(() => {
    apiFetch('/catalog')
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(data => { setProducts(data); setLoading(false) })
      .catch(err => { console.error('[Catalog] fetch failed:', err); setLoading(false) })
  }, [])

  const visible = products.filter(p => {
    if (filter && p.type !== filter) return false
    if (search) {
      const q = search.toLowerCase()
      if (!p.name.toLowerCase().includes(q) && !p.collection.toLowerCase().includes(q)) return false
    }
    return true
  })

  const toggle = (product) => {
    setSelected(prev => {
      const has = prev.some(p => p.id === product.id)
      if (has) return prev.filter(p => p.id !== product.id)
      if (prev.length >= 4) return prev
      return [...prev, product]
    })
  }

  const isSelected = (p) => selected.some(s => s.id === p.id)

  // Search input (shared)
  const searchInput = (
    <div style={{
      background: 'var(--surface)',
      border: '1.5px solid var(--border)',
      borderRadius: 'var(--r-md)',
      padding: '0 14px',
      display: 'flex', alignItems: 'center', gap: 10,
      height: 42,
    }}>
      <span style={{ color: 'var(--text-3)', display: 'flex', alignItems: 'center' }}>
        <IconSearch size={16} />
      </span>
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder={t('app.catalog.search_ph')}
        style={{
          flex: 1, background: 'none', border: 'none', outline: 'none',
          fontSize: '0.85rem', color: 'var(--ink)',
          fontFamily: 'var(--font-body)',
        }}
      />
      {search && (
        <button onClick={() => setSearch('')} style={{
          background: 'none', border: 'none', color: 'var(--text-3)',
          cursor: 'pointer', display: 'flex', padding: 2,
        }}>
          <IconX size={14} />
        </button>
      )}
    </div>
  )

  // Filter chips (shared)
  const filterChips = (vertical) => (
    <div style={{
      display: 'flex',
      flexDirection: vertical ? 'column' : 'row',
      gap: 7,
      padding: vertical ? '4px 0' : undefined,
    }}>
      {TYPE_FILTERS.map(tf => {
        const active = filter === tf.value
        return (
          <button
            key={tf.value}
            onClick={() => setFilter(tf.value)}
            style={{
              flexShrink: 0,
              padding: vertical ? '8px 12px' : '5px 14px',
              borderRadius: 'var(--r-full)',
              fontSize: '0.7rem',
              fontWeight: active ? 700 : 500,
              background: active ? 'var(--accent)' : 'var(--surface)',
              border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
              color: active ? '#fff' : 'var(--text-2)',
              transition: 'all var(--duration)',
              cursor: 'pointer',
              textAlign: vertical ? 'left' : 'center',
            }}
          >
            {tf.label}
          </button>
        )
      })}
    </div>
  )

  // Visualise FAB
  const visualiseFab = (
    selected.length > 0 && (
      <div style={{
        position: 'absolute',
        bottom: 'calc(var(--nav-height) + 12px)',
        left: 16, right: 16,
        zIndex: 40,
        animation: 'fab-in 0.22s var(--ease-out) both',
      }}>
        <button
          onClick={() => onGenerate(selected)}
          style={{
            width: '100%',
            padding: '15px 20px',
            borderRadius: 'var(--r-xl)',
            background: 'var(--ink)',
            color: 'var(--text-on-ink)',
            border: 'none',
            fontSize: '0.88rem',
            fontWeight: 600,
            letterSpacing: '0.03em',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            boxShadow: 'var(--shadow-lg)',
            cursor: 'pointer',
          }}
        >
          <span>{t('app.catalog.visualise')} {selected.length} {selected.length === 1 ? t('app.catalog.vis_one') : t('app.catalog.vis_many')}</span>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff',
          }}>
            <IconSparkles size={16} strokeWidth={1.5} />
          </div>
        </button>
      </div>
    )
  )

  if (isDesktop) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)' }}>
        <MobileMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
        <style>{`
          @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
          @keyframes fab-in  { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        `}</style>

        <TopBar
          title={t('app.catalog.title')}
          onBack={onBack}
          right={
            <span style={{
              fontSize: '0.68rem', fontWeight: 700,
              color: 'var(--text-3)',
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-full)',
              padding: '3px 10px',
            }}>
              {visible.length}
            </span>
          }
        />

        {/* ── Desktop: sidebar filters + main grid ── */}
        <div style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '220px 1fr',
          overflow: 'hidden',
        }}>
          {/* Sidebar */}
          <div className="scroll" style={{
            borderInlineEnd: '1px solid var(--border)',
            padding: '20px 16px',
            paddingBottom: 'calc(var(--nav-height) + 16px)',
            overflowY: 'auto',
            display: 'flex', flexDirection: 'column', gap: 16,
          }}>
            {searchInput}

            <div>
              <div style={{
                fontSize: '0.56rem', fontWeight: 700, letterSpacing: '0.14em',
                textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 10,
              }}>
                {t('app.catalog.type_label')}
              </div>
              {filterChips(true)}
            </div>

            {selected.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <div style={{
                  fontSize: '0.56rem', fontWeight: 700, letterSpacing: '0.14em',
                  textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 10,
                }}>
                  {t('app.catalog.selected_label')} ({selected.length}/4)
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {selected.map(p => (
                    <div key={p.id} style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      background: 'var(--accent-dim)',
                      border: '1px solid rgba(192,112,80,.2)',
                      borderRadius: 'var(--r-sm)',
                      padding: '6px 10px',
                    }}>
                      <div style={{
                        width: 20, height: 20, borderRadius: 4, flexShrink: 0,
                        background: SWATCH_COLORS[p.color_hex] || p.color_hex,
                      }} />
                      <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--ink)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.name}
                      </span>
                      <button onClick={() => toggle(p)} style={{ color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                        <IconX size={12} />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => onGenerate(selected)}
                  style={{
                    width: '100%', marginTop: 12,
                    padding: '13px 16px',
                    borderRadius: 'var(--r-md)',
                    background: 'var(--ink)',
                    color: 'var(--text-on-ink)',
                    border: 'none',
                    fontSize: '0.82rem', fontWeight: 600,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    cursor: 'pointer',
                  }}
                >
                  <span>{t('app.catalog.visualise')} {selected.length}</span>
                  <IconSparkles size={16} strokeWidth={1.5} />
                </button>
              </div>
            )}
          </div>

          {/* Fabric grid */}
          <div className="scroll" style={{
            padding: '20px 24px',
            paddingBottom: 'calc(var(--nav-height) + 20px)',
            overflowY: 'auto',
          }}>
            {!loading && visible.length === 0 && (
              <div style={{ textAlign: 'center', padding: '80px 0' }}>
                <div style={{ color: 'var(--text-3)', marginBottom: 12, display: 'flex', justifyContent: 'center' }}>
                  <IconScissors size={36} />
                </div>
                <div style={{ fontSize: '.85rem', fontWeight: 600, color: 'var(--text-2)' }}>{t('app.catalog.no_fabrics')}</div>
                <div style={{ fontSize: '.75rem', color: 'var(--text-3)', marginTop: 4 }}>{t('app.catalog.no_fabrics_hint')}</div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
              {loading
                ? Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)
                : visible.map(p => (
                    <FabricCard
                      key={p.id}
                      product={p}
                      selected={isSelected(p)}
                      onToggle={toggle}
                    />
                  ))
              }
            </div>
          </div>
        </div>

        <BottomNav activeIcon={IconScissors} activeLabel={t('app.catalog.nav_label')} onMenu={() => setMenuOpen(true)} />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)' }}>
      <MobileMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      <style>{`
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        @keyframes fab-in  { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      <TopBar
        title={t('app.catalog.title')}
        onBack={onBack}
        right={
          <span style={{
            fontSize: '0.68rem', fontWeight: 700,
            color: 'var(--text-3)',
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-full)',
            padding: '3px 10px',
            minWidth: 28,
            textAlign: 'center',
          }}>
            {visible.length}
          </span>
        }
      />

      {/* Search */}
      <div style={{ margin: '12px 16px 0' }}>
        {searchInput}
      </div>

      {/* Type filter chips */}
      <div className="scroll-x" style={{ display: 'flex', gap: 7, padding: '10px 16px' }}>
        {filterChips(false)}
      </div>

      <div style={{ height: 1, background: 'var(--border)', margin: '0 16px', flexShrink: 0 }} />

      {/* Fabric grid */}
      <div
        className="scroll"
        style={{
          flex: 1,
          padding: '14px 16px',
          paddingBottom: `calc(var(--nav-height) + ${selected.length > 0 ? 86 : 20}px)`,
          transition: 'padding-bottom 0.3s var(--ease)',
        }}
      >
        {!loading && visible.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ color: 'var(--text-3)', marginBottom: 12, display: 'flex', justifyContent: 'center' }}>
              <IconScissors size={36} />
            </div>
            <div style={{ fontSize: '.85rem', fontWeight: 600, color: 'var(--text-2)' }}>No fabrics found</div>
            <div style={{ fontSize: '.75rem', color: 'var(--text-3)', marginTop: 4 }}>Try a different search or filter</div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            : visible.map(p => (
                <FabricCard
                  key={p.id}
                  product={p}
                  selected={isSelected(p)}
                  onToggle={toggle}
                />
              ))
          }
        </div>
      </div>

      {visualiseFab}

      <BottomNav activeIcon={IconScissors} activeLabel={t('app.catalog.nav_label')} onMenu={() => setMenuOpen(true)} />
    </div>
  )
}
