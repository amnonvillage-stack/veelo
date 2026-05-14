import { useState, useEffect, useRef } from 'react'
import TopBar from '../components/TopBar.jsx'
import { apiFetch } from '../../api.js'

const TYPES    = ['eyelet','pleated','roman','roller']
const DENSITIES = ['sheer','light','medium','heavy','blackout']
const COLLECTIONS = ['Essentials','Countryside','Evening','Maritime','Garden','Light','Winter','Boudoir','Sleep']

const SWATCH_COLORS = {
  '#d4c8a8': 'repeating-linear-gradient(0deg,rgba(180,160,120,.2) 0,rgba(180,160,120,.2) 1px,transparent 1px,transparent 7px),repeating-linear-gradient(90deg,rgba(180,160,120,.2) 0,rgba(180,160,120,.2) 1px,transparent 1px,transparent 7px),#d4c8a8',
  '#3d1f60': 'radial-gradient(ellipse at 35% 35%,#7b5ea0,#3d1f60)',
  '#1e2f60': 'linear-gradient(160deg,#1e2f60,#0e1830)',
  '#c86050': 'linear-gradient(135deg,#c86050,#a04030)',
  '#7a2535': 'linear-gradient(135deg,#7a2535,#5a1520)',
}

function swatchBg(hex) {
  return SWATCH_COLORS[hex] || hex
}

// ── Field component ────────────────────────────────────────────────────────────
function Field({ label, required, children }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
      <label style={{
        fontSize:'0.6rem', fontWeight:700, letterSpacing:'0.14em',
        textTransform:'uppercase', color:'var(--text-3)',
      }}>
        {label}{required && <span style={{ color:'var(--accent)' }}> *</span>}
      </label>
      {children}
    </div>
  )
}

const inputStyle = {
  background:'var(--surface)',
  border:'1px solid var(--border)',
  borderRadius:'var(--r-sm)',
  padding:'9px 12px',
  fontSize:'0.85rem',
  color:'var(--ink)',
  outline:'none',
  width:'100%',
  fontFamily:'var(--font-body)',
}

const selectStyle = {
  ...inputStyle,
  cursor:'pointer',
  appearance:'none',
  backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23b0a090' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
  backgroundRepeat:'no-repeat',
  backgroundPosition:'right 12px center',
  paddingRight:32,
}

// ── Empty form state ───────────────────────────────────────────────────────────
const EMPTY = {
  name:'', collection:'Essentials', type:'eyelet',
  density:'medium', price_per_m:'', description:'',
  color_hex:'#888888', in_stock:true, lead_days:'7', currency:'ILS',
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function Admin({ onBack, debugMode, onToggleDebug }) {
  const [products,  setProducts]  = useState([])
  const [form,      setForm]      = useState(EMPTY)
  const [swatchFile, setSwatchFile] = useState(null)
  const [swatchUrl,  setSwatchUrl]  = useState(null)
  const [saving,    setSaving]    = useState(false)
  const [deleting,  setDeleting]  = useState(null)  // product id being deleted
  const [error,     setError]     = useState(null)
  const [success,   setSuccess]   = useState(null)
  const fileRef = useRef(null)

  const loadProducts = () => {
    apiFetch('/catalog')
      .then(r => {
        if (!r.ok) throw new Error(`Server returned ${r.status}`)
        return r.json()
      })
      .then(data => {
        if (!Array.isArray(data)) throw new Error('Unexpected response from /catalog')
        setProducts(data)
      })
      .catch(e => setError(`Could not load catalogue: ${e.message}`))
  }

  useEffect(() => { loadProducts() }, [])

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const handleSwatchPick = (file) => {
    if (!file) return
    setSwatchFile(file)
    setSwatchUrl(URL.createObjectURL(file))
    // Auto-detect dominant color from image name as a hint
  }

  const handleSave = async () => {
    if (!form.name || !form.price_per_m || !swatchFile) {
      setError('Name, price, and swatch image are required.')
      return
    }
    setSaving(true)
    setError(null)
    setSuccess(null)

    const fd = new FormData()
    fd.append('swatch',      swatchFile)
    fd.append('name',        form.name)
    fd.append('collection',  form.collection)
    fd.append('type',        form.type)
    fd.append('density',     form.density)
    fd.append('price_per_m', form.price_per_m)
    fd.append('description', form.description)
    fd.append('color_hex',   form.color_hex)
    fd.append('in_stock',    form.in_stock)
    fd.append('lead_days',   form.lead_days || 7)
    fd.append('currency',    form.currency)

    try {
      const res = await apiFetch('/catalog/products', { method:'POST', body:fd })
      if (!res.ok) throw new Error(await res.text())
      setSuccess(`"${form.name}" added to catalogue.`)
      setForm(EMPTY)
      setSwatchFile(null)
      setSwatchUrl(null)
      loadProducts()
    } catch(e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (product) => {
    if (!window.confirm(`Remove "${product.name}" from the catalogue?`)) return
    setDeleting(product.id)
    try {
      const res = await apiFetch(`/catalog/products/${product.id}`, { method:'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      setSuccess(`"${product.name}" removed.`)
      loadProducts()
    } catch(e) {
      setError(e.message)
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'var(--bg)' }}>
      <TopBar
        title="Fabric Admin"
        onBack={onBack}
        right={
          <span style={{
            fontSize:'0.6rem', fontWeight:700, letterSpacing:'0.12em',
            textTransform:'uppercase', color:'var(--text-3)',
          }}>
            {products.length} fabrics
          </span>
        }
      />

      <div className="scroll" style={{ flex:1, padding:'0 20px 40px' }}>

        {/* ── Debug settings ─────────────────────────────────────────── */}
        <div style={{
          background: debugMode ? 'rgba(192,112,80,.06)' : 'var(--surface)',
          border: `1px solid ${debugMode ? 'var(--accent)' : 'var(--border)'}`,
          borderRadius: 'var(--r-md)',
          padding: '14px 16px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          transition: 'all var(--duration)',
        }}>
          <div>
            <div style={{
              fontSize: '0.78rem', fontWeight: 700,
              color: debugMode ? 'var(--accent)' : 'var(--ink)',
            }}>
              🔬 Debug prompts
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-3)', marginTop: 3, lineHeight: 1.4 }}>
              {debugMode
                ? 'ON — generation will pause after analysis so you can inspect the full Gemini prompt.'
                : 'OFF — generation runs immediately after analysis.'}
            </div>
          </div>
          <button
            onClick={onToggleDebug}
            style={{
              width: 46, height: 26, borderRadius: 13,
              background: debugMode ? 'var(--accent)' : 'var(--surface-3)',
              border: 'none', position: 'relative', cursor: 'pointer',
              transition: 'background var(--duration)', flexShrink: 0,
            }}
          >
            <div style={{
              width: 20, height: 20, borderRadius: '50%', background: '#fff',
              position: 'absolute', top: 3,
              left: debugMode ? 23 : 3,
              transition: 'left var(--duration)',
              boxShadow: '0 1px 3px rgba(0,0,0,.25)',
            }} />
          </button>
        </div>

        {/* ── Add fabric form ─────────────────────────────────────────── */}
        <div style={{
          background:'var(--surface)',
          border:'1px solid var(--border)',
          borderRadius:'var(--r-lg)',
          overflow:'hidden',
          marginBottom:24,
        }}>
          {/* Form header */}
          <div style={{
            padding:'14px 18px',
            borderBottom:'1px solid var(--border)',
            display:'flex', alignItems:'center', gap:10,
          }}>
            <span style={{ fontSize:'1.1rem' }}>＋</span>
            <span style={{
              fontFamily:'var(--font-display)',
              fontSize:'1.1rem', fontWeight:500, color:'var(--ink)',
            }}>
              Add new fabric
            </span>
          </div>

          <div style={{ padding:'18px', display:'flex', flexDirection:'column', gap:14 }}>

            {/* Swatch upload */}
            <Field label="Swatch image" required>
              <div
                onClick={() => fileRef.current?.click()}
                style={{
                  border: swatchUrl ? '1.5px solid var(--accent)' : '1.5px dashed var(--border-2)',
                  borderRadius:'var(--r-md)',
                  overflow:'hidden',
                  cursor:'pointer',
                  height:110,
                  display:'flex',
                  alignItems:'center',
                  justifyContent:'center',
                  background: swatchUrl ? 'none' : 'var(--surface-2)',
                  position:'relative',
                  transition:'border-color var(--duration)',
                }}
              >
                {swatchUrl ? (
                  <>
                    <img src={swatchUrl} alt="swatch" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    <div style={{
                      position:'absolute', inset:0,
                      background:'rgba(250,246,240,.7)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      opacity:0, transition:'opacity var(--duration)',
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity=1}
                    onMouseLeave={e => e.currentTarget.style.opacity=0}
                    >
                      <span style={{ fontSize:'0.78rem', fontWeight:600, color:'var(--ink)' }}>Change image</span>
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign:'center', color:'var(--text-3)' }}>
                    <div style={{ fontSize:'1.8rem', marginBottom:6 }}>🧵</div>
                    <div style={{ fontSize:'0.75rem', fontWeight:500 }}>Tap to upload swatch</div>
                  </div>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                style={{ display:'none' }}
                onChange={e => handleSwatchPick(e.target.files[0])}
              />
            </Field>

            {/* Name */}
            <Field label="Fabric name" required>
              <input
                style={inputStyle}
                value={form.name}
                onChange={e => set('name', e.target.value)}
                placeholder="e.g. Burgundy Silk"
              />
            </Field>

            {/* Collection + Type */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <Field label="Collection">
                <select style={selectStyle} value={form.collection} onChange={e => set('collection', e.target.value)}>
                  {COLLECTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  <option value="__custom">+ Custom…</option>
                </select>
              </Field>
              <Field label="Type" required>
                <select style={selectStyle} value={form.type} onChange={e => set('type', e.target.value)}>
                  {TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
                </select>
              </Field>
            </div>

            {/* Price + Density */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <Field label="Price / meter (₪)" required>
                <input
                  style={inputStyle}
                  type="number"
                  value={form.price_per_m}
                  onChange={e => set('price_per_m', e.target.value)}
                  placeholder="e.g. 210"
                  min="1"
                />
              </Field>
              <Field label="Density">
                <select style={selectStyle} value={form.density} onChange={e => set('density', e.target.value)}>
                  {DENSITIES.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase()+d.slice(1)}</option>)}
                </select>
              </Field>
            </div>

            {/* Color hex + Lead days */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <Field label="Accent colour (hex)">
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <input
                    type="color"
                    value={form.color_hex}
                    onChange={e => set('color_hex', e.target.value)}
                    style={{
                      width:38, height:38, borderRadius:'var(--r-sm)',
                      border:'1px solid var(--border)', cursor:'pointer',
                      padding:2, background:'none',
                    }}
                  />
                  <input
                    style={{ ...inputStyle, flex:1 }}
                    value={form.color_hex}
                    onChange={e => set('color_hex', e.target.value)}
                    placeholder="#888888"
                  />
                </div>
              </Field>
              <Field label="Lead time (days)">
                <input
                  style={inputStyle}
                  type="number"
                  value={form.lead_days}
                  onChange={e => set('lead_days', e.target.value)}
                  min="1"
                />
              </Field>
            </div>

            {/* Description */}
            <Field label="Description">
              <textarea
                style={{ ...inputStyle, resize:'vertical', minHeight:70, lineHeight:1.5 }}
                value={form.description}
                onChange={e => set('description', e.target.value)}
                placeholder="Brief textile description used in AI prompts…"
              />
            </Field>

            {/* In stock toggle */}
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <button
                onClick={() => set('in_stock', !form.in_stock)}
                style={{
                  width:42, height:24, borderRadius:12,
                  background: form.in_stock ? 'var(--accent)' : 'var(--surface-3)',
                  border:'none', position:'relative', cursor:'pointer',
                  transition:'background var(--duration)',
                  flexShrink:0,
                }}
              >
                <div style={{
                  width:18, height:18, borderRadius:'50%', background:'#fff',
                  position:'absolute', top:3,
                  left: form.in_stock ? 21 : 3,
                  transition:'left var(--duration)',
                  boxShadow:'0 1px 3px rgba(0,0,0,.2)',
                }} />
              </button>
              <span style={{ fontSize:'0.78rem', color:'var(--text-2)' }}>
                {form.in_stock ? 'In stock' : 'Out of stock'}
              </span>
            </div>

            {/* Feedback */}
            {error && (
              <div style={{
                background:'rgba(192,64,64,.08)', border:'1px solid rgba(192,64,64,.2)',
                borderRadius:'var(--r-sm)', padding:'10px 12px',
                fontSize:'0.75rem', color:'var(--error)',
              }}>
                ⚠️ {error}
              </div>
            )}
            {success && (
              <div style={{
                background:'rgba(90,138,96,.08)', border:'1px solid rgba(90,138,96,.2)',
                borderRadius:'var(--r-sm)', padding:'10px 12px',
                fontSize:'0.75rem', color:'var(--success)',
              }}>
                ✓ {success}
              </div>
            )}

            {/* Save button */}
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding:'14px', borderRadius:'var(--r-md)',
                background: saving ? 'var(--surface-3)' : 'var(--ink)',
                color: saving ? 'var(--text-3)' : 'var(--bg)',
                border:'none', fontSize:'0.85rem', fontWeight:500,
                letterSpacing:'0.06em', textTransform:'uppercase',
                cursor: saving ? 'not-allowed' : 'pointer',
                transition:'background var(--duration)',
              }}
            >
              {saving ? 'Saving…' : 'Add to Catalogue'}
            </button>

          </div>
        </div>

        {/* ── Existing fabrics ─────────────────────────────────────────── */}
        <div style={{
          fontSize:'0.6rem', fontWeight:700, letterSpacing:'0.14em',
          textTransform:'uppercase', color:'var(--text-3)',
          marginBottom:12,
        }}>
          Current catalogue · {products.length} fabrics
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {products.map(p => (
            <div key={p.id} style={{
              display:'flex', alignItems:'center', gap:12,
              background:'var(--surface)',
              border:'1px solid var(--border)',
              borderRadius:'var(--r-md)',
              padding:'10px 14px',
            }}>
              {/* Swatch thumb */}
              <div style={{
                width:48, height:48, borderRadius:'var(--r-sm)',
                flexShrink:0, overflow:'hidden',
                background: swatchBg(p.color_hex),
              }}>
                <img
                  src={p.swatch_path}
                  alt={p.name}
                  style={{ width:'100%', height:'100%', objectFit:'cover' }}
                  onError={e => { e.target.style.display='none' }}
                />
              </div>

              {/* Info */}
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{
                  fontFamily:'var(--font-display)',
                  fontSize:'0.95rem', fontWeight:500, color:'var(--ink)',
                  whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
                }}>
                  {p.name}
                </div>
                <div style={{ fontSize:'0.62rem', color:'var(--text-3)', marginTop:2 }}>
                  {p.collection} · {p.type} · ₪{p.price_per_m}/m
                  {!p.in_stock && <span style={{ color:'var(--error)', marginLeft:6 }}>out of stock</span>}
                </div>
              </div>

              {/* Delete */}
              <button
                onClick={() => handleDelete(p)}
                disabled={deleting === p.id}
                style={{
                  width:32, height:32, borderRadius:'var(--r-sm)',
                  background:'var(--surface-2)',
                  border:'1px solid var(--border)',
                  color: deleting === p.id ? 'var(--text-4)' : 'var(--text-3)',
                  fontSize:'0.9rem', cursor: deleting === p.id ? 'not-allowed' : 'pointer',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  transition:'background var(--duration)',
                  flexShrink:0,
                }}
                title="Remove from catalogue"
              >
                {deleting === p.id ? '…' : '✕'}
              </button>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
