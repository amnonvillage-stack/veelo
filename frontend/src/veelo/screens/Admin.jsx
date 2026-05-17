import { useState, useEffect, useRef } from 'react'
import TopBar from '../components/TopBar.jsx'
import { apiFetch, API_BASE } from '../../api.js'

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

// ── Session storage key for admin authentication ───────────────────────────────
const ADMIN_SESSION_KEY = 'veelo.admin.key'

// ── Key-gate screen ────────────────────────────────────────────────────────────
function AdminGate({ onUnlock }) {
  const [keyInput,   setKeyInput]   = useState('')
  const [gateError,  setGateError]  = useState(null)
  const [verifying,  setVerifying]  = useState(false)

  const handleSubmit = async (e) => {
    e?.preventDefault()
    const key = keyInput.trim()
    if (!key) return
    setVerifying(true)
    setGateError(null)
    try {
      const res = await apiFetch('/admin/verify', {
        headers: { 'X-Admin-Key': key },
      })
      if (!res.ok) throw new Error('wrong key')
      sessionStorage.setItem(ADMIN_SESSION_KEY, key)
      onUnlock(key)
    } catch {
      setGateError('Wrong key — try again.')
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div style={{
      display:'flex', flexDirection:'column', alignItems:'center',
      justifyContent:'center', height:'100%',
      background:'var(--bg)', padding:32, gap:24,
    }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:'2.4rem', marginBottom:12 }}>🔒</div>
        <div style={{
          fontFamily:'var(--font-display)', fontSize:'1.4rem',
          fontWeight:500, color:'var(--ink)', marginBottom:6,
        }}>
          Admin area
        </div>
        <div style={{ fontSize:'0.78rem', color:'var(--text-3)' }}>
          Enter the admin key to continue
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{
        width:'100%', maxWidth:320,
        display:'flex', flexDirection:'column', gap:12,
      }}>
        <input
          autoFocus
          type="password"
          value={keyInput}
          onChange={e => { setKeyInput(e.target.value); setGateError(null) }}
          placeholder="Admin key"
          style={inputStyle}
        />

        {gateError && (
          <div style={{
            fontSize:'0.75rem', color:'var(--error)',
            background:'rgba(192,64,64,.08)',
            border:'1px solid rgba(192,64,64,.2)',
            borderRadius:'var(--r-sm)', padding:'8px 12px',
          }}>
            ⚠️ {gateError}
          </div>
        )}

        <button
          type="submit"
          disabled={verifying || !keyInput.trim()}
          style={{
            padding:'13px', borderRadius:'var(--r-md)',
            background: (verifying || !keyInput.trim()) ? 'var(--surface-3)' : 'var(--ink)',
            color: (verifying || !keyInput.trim()) ? 'var(--text-3)' : 'var(--bg)',
            border:'none', fontSize:'0.85rem', fontWeight:500,
            letterSpacing:'0.06em', textTransform:'uppercase',
            cursor: (verifying || !keyInput.trim()) ? 'not-allowed' : 'pointer',
            transition:'background var(--duration)',
          }}
        >
          {verifying ? 'Verifying…' : 'Unlock'}
        </button>
      </form>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function Admin({ onBack, debugMode, onToggleDebug }) {
  // Restore key from sessionStorage so Vicky doesn't re-enter on every visit
  const [isUnlocked, setIsUnlocked] = useState(() => !!sessionStorage.getItem(ADMIN_SESSION_KEY))
  const [adminKey,   setAdminKey]   = useState(() => sessionStorage.getItem(ADMIN_SESSION_KEY) || '')
  const [activeTab,  setActiveTab]  = useState('fabrics') // 'fabrics' | 'images'

  const [products,  setProducts]  = useState([])
  const [form,      setForm]      = useState(EMPTY)
  const [swatchFile, setSwatchFile] = useState(null)
  const [swatchUrl,  setSwatchUrl]  = useState(null)
  const [saving,    setSaving]    = useState(false)
  const [deleting,  setDeleting]  = useState(null)
  const [error,     setError]     = useState(null)
  const [success,   setSuccess]   = useState(null)
  const fileRef = useRef(null)

  // ── Images tab ──────────────────────────────────────────────────────────────
  const [imgCfg,       setImgCfg]     = useState(null)
  const [imgUploading, setImgUploading] = useState(null) // slot key being uploaded
  const [imgError,     setImgError]   = useState(null)
  const [imgSuccess,   setImgSuccess] = useState(null)
  const imgFileRef  = useRef(null)
  const [pendingSlot, setPendingSlot] = useState(null)  // which slot the hidden input will feed

  const loadImgCfg = () =>
    apiFetch('/site-images/config')
      .then(r => r.ok ? r.json() : null)
      .then(cfg => { if (cfg) setImgCfg(cfg) })
      .catch(() => {})

  useEffect(() => { if (isUnlocked) loadImgCfg() }, [isUnlocked])

  const triggerImgUpload = (slot) => {
    setPendingSlot(slot)
    setTimeout(() => imgFileRef.current?.click(), 0)
  }

  const handleImgFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !pendingSlot) return
    e.target.value = ''

    const isStrip = pendingSlot === 'strip'
    const endpoint = isStrip ? '/site-images/strip' : `/site-images/collage/${pendingSlot}`

    setImgUploading(pendingSlot)
    setImgError(null)
    setImgSuccess(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      if (isStrip) fd.append('alt', 'Interior design work')

      const r = await apiFetch(endpoint, {
        method: 'POST',
        headers: { 'X-Admin-Key': adminKey },
        body: fd,
      })
      if (!r.ok) {
        const d = await r.json().catch(() => ({}))
        throw new Error(d.detail || `HTTP ${r.status}`)
      }
      await loadImgCfg()
      setImgSuccess(`${isStrip ? 'Strip photo' : pendingSlot} updated ✓`)
      setTimeout(() => setImgSuccess(null), 3000)
    } catch (err) {
      setImgError(err.message)
    } finally {
      setImgUploading(null)
      setPendingSlot(null)
    }
  }

  const deleteStripPhoto = async (id) => {
    if (!window.confirm('Remove this strip photo?')) return
    setImgError(null)
    try {
      const r = await apiFetch(`/site-images/strip/${id}`, {
        method: 'DELETE',
        headers: { 'X-Admin-Key': adminKey },
      })
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      await loadImgCfg()
    } catch (err) {
      setImgError(err.message)
    }
  }

  const handleUnlock = (key) => {
    setAdminKey(key)
    setIsUnlocked(true)
  }

  const handleLock = () => {
    sessionStorage.removeItem(ADMIN_SESSION_KEY)
    setAdminKey('')
    setIsUnlocked(false)
  }

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
      const res = await apiFetch('/catalog/products', {
        method:'POST', body:fd,
        headers: adminKey ? { 'X-Admin-Key': adminKey } : {},
      })
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
      const res = await apiFetch(`/catalog/products/${product.id}`, {
        method:'DELETE',
        headers: adminKey ? { 'X-Admin-Key': adminKey } : {},
      })
      if (!res.ok) throw new Error('Delete failed')
      setSuccess(`"${product.name}" removed.`)
      loadProducts()
    } catch(e) {
      setError(e.message)
    } finally {
      setDeleting(null)
    }
  }

  // Show gate if not unlocked — TopBar still renders so user can go back
  if (!isUnlocked) {
    return (
      <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'var(--bg)' }}>
        <TopBar title="Fabric Admin" onBack={onBack} />
        <AdminGate onUnlock={handleUnlock} />
      </div>
    )
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'var(--bg)' }}>
      <TopBar
        title="Fabric Admin"
        onBack={onBack}
        right={
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <span style={{
              fontSize:'0.6rem', fontWeight:700, letterSpacing:'0.12em',
              textTransform:'uppercase', color:'var(--text-3)',
            }}>
              {products.length} fabrics
            </span>
            <button
              onClick={handleLock}
              title="Lock admin"
              style={{
                background:'none', border:'1px solid var(--border)',
                borderRadius:'var(--r-sm)', padding:'4px 10px',
                fontSize:'0.65rem', color:'var(--text-3)',
                cursor:'pointer', letterSpacing:'0.08em',
                textTransform:'uppercase', fontWeight:600,
              }}
            >
              🔒 Lock
            </button>
          </div>
        }
      />

      {/* ── Tab bar ──────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', gap: 0,
        borderBottom: '1px solid var(--border)',
        padding: '0 20px',
        background: 'var(--bg)',
        flexShrink: 0,
      }}>
        {[['fabrics','🧵 Fabrics'],['images','🖼 Images']].map(([id, label]) => (
          <button key={id} onClick={() => setActiveTab(id)} style={{
            padding: '12px 18px',
            background: 'none', border: 'none',
            borderBottom: `2px solid ${activeTab === id ? 'var(--accent)' : 'transparent'}`,
            color: activeTab === id ? 'var(--accent)' : 'var(--text-3)',
            fontWeight: activeTab === id ? 700 : 500,
            fontSize: '0.78rem', letterSpacing: '0.04em',
            cursor: 'pointer', transition: 'all var(--duration)',
            marginBottom: -1,
          }}>{label}</button>
        ))}
      </div>

      {/* Hidden file input shared by all image upload slots */}
      <input ref={imgFileRef} type="file" accept="image/*"
        style={{ display:'none' }} onChange={handleImgFileChange} />

      {activeTab === 'images' ? (
        <div className="scroll" style={{ flex:1, padding:'20px 20px 40px' }}>

          {imgError   && <div style={{ color:'#c0392b', fontSize:'.8rem', marginBottom:14 }}>⚠ {imgError}</div>}
          {imgSuccess && <div style={{ color:'#27ae60', fontSize:'.8rem', marginBottom:14 }}>✓ {imgSuccess}</div>}

          {/* ── Collage tiles ──────────────────────────────────────── */}
          <div style={{ fontSize:'.58rem', fontWeight:700, letterSpacing:'.14em',
            textTransform:'uppercase', color:'var(--text-3)', marginBottom:12 }}>
            Collage Tiles
          </div>

          {[
            { slot:'portrait', label:'Portrait tile (large left)' },
            { slot:'fabrics',  label:'Fabrics tile (top right)' },
            { slot:'styling',  label:'Styling tile (bottom right)' },
          ].map(({ slot, label }) => {
            const current = imgCfg?.collage?.[slot]
            const uploading = imgUploading === slot
            return (
              <div key={slot} style={{
                display:'flex', alignItems:'center', gap:14,
                background:'var(--surface)', border:'1px solid var(--border)',
                borderRadius:'var(--r-md)', padding:'12px 14px', marginBottom:10,
              }}>
                {/* Thumbnail */}
                <div style={{
                  width:64, height:64, borderRadius:'var(--r-sm)',
                  background:'var(--surface-2)', flexShrink:0, overflow:'hidden',
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}>
                  {current
                    ? <img src={current} alt={slot}
                        style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    : <span style={{ fontSize:'.6rem', color:'var(--text-4)', textAlign:'center', padding:4 }}>
                        default
                      </span>
                  }
                </div>

                {/* Info + button */}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:'.78rem', fontWeight:600, color:'var(--ink)', marginBottom:3 }}>
                    {label}
                  </div>
                  <div style={{ fontSize:'.65rem', color:'var(--text-4)', overflow:'hidden',
                    textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {current ? current.split('/').pop() : 'Using default static image'}
                  </div>
                </div>
                <button
                  onClick={() => triggerImgUpload(slot)}
                  disabled={uploading}
                  style={{
                    padding:'7px 14px', borderRadius:'var(--r-sm)',
                    background: uploading ? 'var(--surface-3)' : 'var(--ink)',
                    color: uploading ? 'var(--text-3)' : 'var(--bg)',
                    border:'none', fontSize:'.72rem', fontWeight:600,
                    cursor: uploading ? 'not-allowed' : 'pointer', flexShrink:0,
                  }}
                >{uploading ? 'Uploading…' : current ? 'Replace' : 'Upload'}</button>
              </div>
            )
          })}

          {/* ── Strip photos ───────────────────────────────────────── */}
          <div style={{ fontSize:'.58rem', fontWeight:700, letterSpacing:'.14em',
            textTransform:'uppercase', color:'var(--text-3)', margin:'24px 0 12px' }}>
            Strip Photos
          </div>

          {(imgCfg?.strip ?? []).map((photo) => (
            <div key={photo.id} style={{
              display:'flex', alignItems:'center', gap:14,
              background:'var(--surface)', border:'1px solid var(--border)',
              borderRadius:'var(--r-md)', padding:'10px 12px', marginBottom:8,
            }}>
              <div style={{
                width:56, height:56, borderRadius:'var(--r-sm)',
                overflow:'hidden', flexShrink:0,
              }}>
                <img src={photo.url} alt={photo.alt}
                  style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              </div>
              <div style={{ flex:1, fontSize:'.72rem', color:'var(--ink)',
                overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {photo.alt || photo.id}
              </div>
              <button
                onClick={() => deleteStripPhoto(photo.id)}
                style={{
                  padding:'6px 12px', borderRadius:'var(--r-sm)',
                  background:'rgba(192,50,50,.08)', color:'#c03232',
                  border:'1px solid rgba(192,50,50,.25)',
                  fontSize:'.7rem', fontWeight:600, cursor:'pointer', flexShrink:0,
                }}
              >Remove</button>
            </div>
          ))}

          {(imgCfg?.strip?.length ?? 0) === 0 && (
            <div style={{ fontSize:'.75rem', color:'var(--text-4)',
              padding:'12px 0', fontStyle:'italic' }}>
              No custom strip photos yet — using the 4 default static images.
            </div>
          )}

          <button
            onClick={() => triggerImgUpload('strip')}
            disabled={imgUploading === 'strip'}
            style={{
              marginTop:8, width:'100%', padding:'11px',
              borderRadius:'var(--r-md)',
              background: imgUploading === 'strip' ? 'var(--surface-3)' : 'var(--surface)',
              border:'1.5px dashed var(--border)',
              color:'var(--text-2)', fontSize:'.8rem', fontWeight:600,
              cursor: imgUploading === 'strip' ? 'not-allowed' : 'pointer',
            }}
          >{imgUploading === 'strip' ? 'Uploading…' : '+ Add strip photo'}</button>

        </div>
      ) : (
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
                  transition:'background var(--duration)', flexShrink:0,
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
                  src={`${API_BASE}${p.swatch_path}`}
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
      )}
    </div>
  )
}
