import { useState, useEffect } from 'react'
import TopBar    from '../components/TopBar.jsx'
import BottomNav from '../components/BottomNav.jsx'

const DENSITY_LABELS = {
  sheer:    'Sheer',
  light:    'Light',
  medium:   'Medium',
  heavy:    'Heavy',
  blackout: 'Blackout',
}

const TYPE_FILTERS = [
  { value: '',         label: 'All'      },
  { value: 'pleated',  label: 'Pleated'  },
  { value: 'eyelet',   label: 'Eyelet'   },
  { value: 'roman',    label: 'Roman'    },
  { value: 'roller',   label: 'Roller'   },
]

// ── Swatch fallback (CSS gradient when no image file exists) ──────────────────
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
}

function SwatchBg({ hex, style }) {
  return (
    <div style={{
      background: SWATCH_COLORS[hex] || hex,
      ...style,
    }} />
  )
}

// ── Fabric card ───────────────────────────────────────────────────────────────
function FabricCard({ product, selected, onToggle }) {
  return (
    <div
      onClick={() => onToggle(product)}
      style={{
        background: 'var(--surface)',
        border: selected
          ? '2px solid var(--accent)'
          : '1px solid var(--border)',
        borderRadius: 'var(--r-md)',
        overflow: 'hidden',
        cursor: 'pointer',
        position: 'relative',
        boxShadow: selected ? '0 0 0 3px var(--accent-dim)' : 'var(--shadow-sm)',
        transition: 'border-color var(--duration), box-shadow var(--duration)',
      }}
    >
      {/* Swatch — gradient fallback behind actual image */}
      <div style={{ position: 'relative' }}>
        <SwatchBg hex={product.color_hex} style={{ height: 100 }} />
        {product.swatch_path && (
          <img
            src={product.swatch_path}
            alt={product.name}
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              objectFit: 'cover',
            }}
            onError={e => { e.target.style.display = 'none' }}
          />
        )}
        {selected && (
          <div style={{
            position: 'absolute', top: 8, right: 8,
            width: 22, height: 22, borderRadius: '50%',
            background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: '0.6rem', fontWeight: 800,
          }}>✓</div>
        )}
        {!product.in_stock && (
          <div style={{
            position: 'absolute', bottom: 6, left: 6,
            fontSize: '0.54rem', fontWeight: 700, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: '#fff',
            background: 'rgba(26,22,16,.7)', borderRadius: 4,
            padding: '2px 6px',
          }}>
            Out of stock
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '9px 11px 12px' }}>
        <div style={{
          fontSize: '0.56rem', fontWeight: 700, letterSpacing: '0.14em',
          textTransform: 'uppercase', color: 'var(--accent)',
          marginBottom: 2,
        }}>
          {product.collection} · {product.type}
        </div>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.05rem', fontWeight: 500,
          color: 'var(--ink)', lineHeight: 1.2,
        }}>
          {product.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-2)' }}>
            ₪{product.price_per_m} / m
          </span>
          <span style={{
            fontSize: '0.56rem', fontWeight: 600,
            color: 'var(--text-3)', letterSpacing: '0.08em',
          }}>
            {DENSITY_LABELS[product.density]}
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Screen ────────────────────────────────────────────────────────────────────
export default function Catalog({ curtainType, onBack, onGenerate }) {
  const [products,  setProducts]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [filter,    setFilter]    = useState(curtainType || '')
  const [search,    setSearch]    = useState('')
  const [selected,  setSelected]  = useState([])  // array of product objects

  // ── Load catalog ────────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/catalog')
      .then(r => r.json())
      .then(data => { setProducts(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  // ── Filter ──────────────────────────────────────────────────────────────
  const visible = products.filter(p => {
    if (filter && p.type !== filter) return false
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) &&
                  !p.collection.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const toggle = (product) => {
    setSelected(prev => {
      const has = prev.some(p => p.id === product.id)
      if (has) return prev.filter(p => p.id !== product.id)
      if (prev.length >= 4) return prev  // max 4
      return [...prev, product]
    })
  }

  const isSelected = (product) => selected.some(p => p.id === product.id)

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'var(--bg)' }}>
      <TopBar
        title="Choose fabric"
        onBack={onBack}
        right={
          <span style={{ fontSize:'0.72rem', color:'var(--text-3)' }}>
            {filter
              ? `${visible.length} ${filter} fabrics`
              : `${visible.length} fabrics`}
          </span>
        }
      />

      {/* Search */}
      <div style={{
        margin: '0 20px 12px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-md)',
        padding: '9px 14px',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ fontSize: '0.9rem', opacity: .6 }}>🔍</span>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search fabrics…"
          style={{
            flex: 1, background: 'none', border: 'none', outline: 'none',
            fontSize: '0.82rem', color: 'var(--ink)',
          }}
        />
        {search && (
          <button onClick={() => setSearch('')} style={{ background:'none', border:'none', color:'var(--text-3)', cursor:'pointer' }}>✕</button>
        )}
      </div>

      {/* Type filter chips */}
      <div className="scroll-x" style={{ display:'flex', gap:8, padding:'0 20px 12px' }}>
        {TYPE_FILTERS.map(t => (
          <button
            key={t.value}
            onClick={() => setFilter(t.value)}
            style={{
              flexShrink: 0,
              padding: '6px 16px',
              borderRadius: 'var(--r-full)',
              fontSize: '0.68rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              background: filter === t.value ? 'var(--accent-dim)' : 'var(--surface-2)',
              border: filter === t.value ? '1.5px solid var(--accent)' : '1.5px solid transparent',
              color: filter === t.value ? 'var(--accent)' : 'var(--text-2)',
              transition: 'all var(--duration)',
              cursor: 'pointer',
            }}
          >
            {t.label}
            {filter === t.value && t.value && ' ✓'}
          </button>
        ))}
      </div>

      <div style={{ height: 1, background: 'var(--border)', margin: '0 20px 4px', flexShrink: 0 }} />

      {/* Fabric grid */}
      <div
        className="scroll"
        style={{
          flex: 1,
          padding: '12px 20px',
          paddingBottom: `calc(var(--nav-height) + ${selected.length > 0 ? 80 : 16}px)`,
        }}
      >
        {loading && (
          <div style={{ textAlign:'center', padding:'40px 0', color:'var(--text-3)', fontSize:'.85rem' }}>
            Loading collection…
          </div>
        )}
        {!loading && visible.length === 0 && (
          <div style={{ textAlign:'center', padding:'40px 0' }}>
            <div style={{ fontSize:'2rem', marginBottom:8 }}>🧵</div>
            <div style={{ fontSize:'.82rem', color:'var(--text-3)' }}>No fabrics found</div>
          </div>
        )}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          {visible.map(p => (
            <FabricCard
              key={p.id}
              product={p}
              selected={isSelected(p)}
              onToggle={toggle}
            />
          ))}
        </div>
      </div>

      {/* Generate FAB */}
      {selected.length > 0 && (
        <div style={{
          position: 'absolute',
          bottom: 'calc(var(--nav-height) + 14px)',
          left: 20, right: 20,
          zIndex: 40,
        }}>
          <button
            onClick={() => onGenerate(selected)}
            style={{
              width: '100%',
              padding: '15px 20px',
              borderRadius: 'var(--r-xl)',
              background: 'var(--ink)',
              color: 'var(--bg)',
              border: 'none',
              fontSize: '0.88rem',
              fontWeight: 500,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
              boxShadow: 'var(--shadow-lg)',
              cursor: 'pointer',
            }}
          >
            <span>Visualise {selected.length} {selected.length === 1 ? 'fabric' : 'fabrics'}</span>
            <div style={{
              width: 24, height: 24, borderRadius: '50%',
              background: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.68rem', fontWeight: 800,
            }}>
              {selected.length}
            </div>
          </button>
        </div>
      )}

      <BottomNav activeIcon="🧵" activeLabel="Fabrics" />
    </div>
  )
}
