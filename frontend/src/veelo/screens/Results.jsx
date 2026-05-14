// ── Results ───────────────────────────────────────────────────────────────────
// Displays AI-generated curtain visualisations.
// Features: main viewer, swipe dots, action bar (save / share / compare),
// fabric grid for switching, quote strip, compare-mode.

import { useState, useRef } from 'react'
import TopBar    from '../components/TopBar.jsx'
import BottomNav from '../components/BottomNav.jsx'
import MobileMenu from '../components/MobileMenu.jsx'
import Toast, { useToast } from '../components/Toast.jsx'
import { useDesktop } from '../hooks/useDesktop.js'
import { useT } from '../../i18n/useT.js'
import { apiFetch, API_BASE } from '../../api.js'
import {
  IconHeart, IconShare, IconGrid, IconSparkles, IconStar, IconWhatsApp,
} from '../components/icons.jsx'

// ── Vicky's WhatsApp number ───────────────────────────────────────────────────
// Set VITE_VICKY_WHATSAPP in Netlify env vars (Israeli format, no + or spaces).
// e.g. 972501234567
const VICKY_WHATSAPP = import.meta.env.VITE_VICKY_WHATSAPP ?? ''

// ── CSS ───────────────────────────────────────────────────────────────────────
const CSS = `
  @keyframes spin   { to { transform:rotate(360deg); } }
  @keyframes slide  { 0%{transform:translateX(-100%)} 50%{transform:translateX(0%)} 100%{transform:translateX(100%)} }
  @keyframes fadeUp { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
`

// ── Loading steps component ───────────────────────────────────────────────────
function StepDot({ status }) {
  const done   = status === 'done'
  const active = status === 'active'
  return (
    <div style={{
      width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: done ? '0.95rem' : '0.7rem', fontWeight: 800,
      background: done ? 'var(--accent)' : active ? 'var(--accent-dim)' : 'var(--surface-2)',
      border: `2px solid ${done || active ? 'var(--accent)' : 'var(--border)'}`,
      color:   done ? '#fff'           : active ? 'var(--accent)'   : 'var(--text-3)',
      transition: 'all 0.3s ease',
    }}>
      {done ? '✓' : active ? '…' : '○'}
    </div>
  )
}

function ProgressSteps({ analysing, generating, ready, total }) {
  const t = useT()
  const step1 = analysing ? 'active' : 'done'
  const step2 = analysing ? 'pending' : (generating || ready > 0) ? 'active' : 'done'
  const genPct = total > 0 ? (ready / total) * 100 : 0

  const rows = [
    {
      status: step1,
      label: t('app.results.analysing_room'),
      sub: analysing ? t('app.results.analysing_sub') : t('app.results.analysed_sub'),
      barPct: null,
    },
    {
      status: step2,
      label: `${t('app.results.generating_label')} ${total} ${total > 1 ? t('app.results.vis_many') : t('app.results.vis_one')}`,
      sub: analysing ? t('app.results.waiting_analysis')
        : generating ? `${ready} ${t('app.results.gen_progress_of')} ${total} ${t('app.results.gen_progress_complete')}`
        : `${ready} ${t('app.results.gen_progress_of')} ${total} ${t('app.results.gen_done_complete')}`,
      barPct: genPct,
    },
  ]

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px' }}>
      <style>{CSS}</style>
      <div style={{
        width: '100%', maxWidth: 480,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)',
        padding: '28px 22px',
        display: 'flex', flexDirection: 'column', gap: 26,
      }}>
        <div style={{ fontSize: '0.56rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
          {t('app.results.preparing')}
        </div>
        {rows.map((r, i) => (
          <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <StepDot status={r.status} />
            <div style={{ flex: 1, paddingTop: 4 }}>
              <div style={{
                fontSize: '0.85rem', fontWeight: 600, lineHeight: 1.2,
                color: r.status !== 'pending' ? 'var(--ink)' : 'var(--text-3)',
                transition: 'color 0.3s',
              }}>
                {r.label}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', marginTop: 2, marginBottom: r.status === 'active' ? 8 : 0 }}>
                {r.sub}
              </div>
              {r.status === 'active' && (
                <div style={{ height: 4, borderRadius: 2, background: 'var(--surface-3)', overflow: 'hidden', position: 'relative' }}>
                  {r.barPct === 0 ? (
                    <div style={{
                      position: 'absolute', top: 0, left: 0, height: '100%', width: '40%',
                      background: 'var(--accent)', borderRadius: 2,
                      animation: 'slide 1.4s ease-in-out infinite',
                    }} />
                  ) : (
                    <div style={{
                      height: '100%', width: `${Math.max(4, r.barPct)}%`,
                      background: 'var(--accent)', borderRadius: 2,
                      transition: 'width 0.5s ease',
                    }} />
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Compact gen-progress bar ──────────────────────────────────────────────────
function GenBar({ ready, total }) {
  const t = useT()
  return (
    <div style={{ padding: '8px 18px 6px', borderBottom: '1px solid var(--border)', background: 'var(--bg)', flexShrink: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontSize: '0.64rem', color: 'var(--text-3)' }}>{t('app.results.gen_bar')}</span>
        <span style={{ fontSize: '0.64rem', fontWeight: 700, color: 'var(--accent)' }}>{ready} / {total}</span>
      </div>
      <div style={{ height: 3, borderRadius: 2, background: 'var(--surface-3)', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${(ready / total) * 100}%`,
          background: 'var(--accent)', borderRadius: 2, transition: 'width 0.5s ease',
        }} />
      </div>
    </div>
  )
}

// ── Prompt preview (debug) ────────────────────────────────────────────────────
function PromptPreview({ preview, onContinue, onCancel }) {
  const { prompt, fabrics } = preview
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{ padding: '12px 20px', background: 'rgba(192,112,80,.06)', borderBottom: '1px solid rgba(192,112,80,.2)', flexShrink: 0 }}>
        <div style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 4 }}>
          🔬 Debug — Gemini prompt preview
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-2)', lineHeight: 1.4 }}>
          Fabrics: <strong style={{ color: 'var(--ink)' }}>{fabrics.map(f => f.name).join(', ')}</strong>
        </div>
      </div>
      <div className="scroll" style={{ flex: 1, padding: '16px 20px', minHeight: 0 }}>
        <pre style={{
          margin: 0, fontFamily: 'monospace', fontSize: '0.72rem', lineHeight: 1.65,
          color: 'var(--ink)', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--r-md)', padding: '14px 16px',
        }}>
          {prompt}
        </pre>
      </div>
      <div style={{ display: 'flex', gap: 10, padding: '12px 20px calc(var(--nav-height) + 12px)', borderTop: '1px solid var(--border)', background: 'var(--bg)' }}>
        <button onClick={onCancel} style={{ flex: 1, padding: '13px', borderRadius: 'var(--r-md)', background: 'none', border: '1px solid var(--border)', color: 'var(--text-2)', fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer' }}>
          ← Back
        </button>
        <button onClick={onContinue} style={{ flex: 2, padding: '13px', borderRadius: 'var(--r-md)', background: 'var(--accent)', border: 'none', color: '#fff', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
          Generate {fabrics.length} →
        </button>
      </div>
    </div>
  )
}

// ── Thumbnail cards ───────────────────────────────────────────────────────────
function SourceThumbnail({ roomUrl, selected, onSelect }) {
  const t = useT()
  return (
    <ThumbnailCard
      imgSrc={roomUrl}
      title={t('app.results.before')}
      subtitle={t('app.results.original_room')}
      badge={{ label: t('app.results.badge_original'), dark: true }}
      selected={selected}
      onSelect={onSelect}
    />
  )
}

function CompareThumbnail({ result, rank, selected, onSelect }) {
  const t = useT()
  return (
    <ThumbnailCard
      imgSrc={result.imageUrl}
      title={result.fabric.name}
      subtitle={`₪${result.fabric.price_per_m} / m`}
      badge={rank === 0 ? { label: t('app.results.badge_top'), accent: true } : null}
      selected={selected}
      onSelect={() => onSelect(result)}
    />
  )
}

function ThumbnailCard({ imgSrc, title, subtitle, badge, selected, onSelect }) {
  return (
    <div
      onClick={onSelect}
      style={{
        borderRadius: 'var(--r-md)',
        overflow: 'hidden',
        border: selected ? '2px solid var(--accent)' : '1px solid var(--border)',
        cursor: 'pointer',
        boxShadow: selected ? '0 0 0 3px var(--accent-glow)' : 'var(--shadow-sm)',
        transition: 'border-color var(--duration), box-shadow var(--duration), transform 0.15s var(--ease)',
        transform: selected ? 'translateY(-1px)' : 'none',
        background: 'var(--surface)',
      }}
    >
      <div style={{ height: 130, background: 'var(--surface-ink)', position: 'relative', overflow: 'hidden' }}>
        <img src={imgSrc} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        {badge && (
          <div style={{
            position: 'absolute', top: 7, left: 7,
            background: badge.accent ? 'var(--accent)' : badge.dark ? 'rgba(26,22,16,.72)' : 'rgba(255,255,255,.88)',
            color: badge.accent || badge.dark ? '#fff' : 'var(--ink)',
            fontSize: '0.5rem', fontWeight: 800, letterSpacing: '0.08em',
            padding: '2px 7px', borderRadius: 'var(--r-xs)',
          }}>
            {badge.label}
          </div>
        )}
      </div>
      <div style={{ padding: '8px 10px 10px' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', fontWeight: 500, color: 'var(--ink)', lineHeight: 1.1 }}>
          {title}
        </div>
        <div style={{ fontSize: '0.62rem', color: 'var(--text-3)', marginTop: 2 }}>{subtitle}</div>
      </div>
    </div>
  )
}

// ── Action button (Save / Share / Compare) ────────────────────────────────────
function ActionBtn({ icon: Icon, label, onClick, disabled, active, color }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        flex: 1, padding: '9px 4px',
        borderRadius: 'var(--r-sm)',
        border: active ? `1px solid ${color || 'var(--accent)'}` : '1px solid var(--border)',
        background: active ? (color ? `${color}18` : 'var(--accent-dim)') : 'var(--surface-2)',
        color: disabled ? 'var(--text-4)' : active ? (color || 'var(--accent)') : 'var(--text-2)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
        cursor: disabled ? 'default' : 'pointer',
        transition: 'all var(--duration)',
      }}
    >
      {Icon && <Icon size={20} filled={active} />}
      <span style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.04em' }}>{label}</span>
    </button>
  )
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function Results({
  results, selectedFabrics, roomUrl,
  czWidthCm, czHeightCm, curtainType,
  analysing, generating, promptPreview, onContinue, onCancelPreview,
  error, onBack, onNewRoom,
}) {
  const [activeIdx,   setActiveIdx]   = useState(0)
  const [saved,       setSaved]       = useState(new Set())
  const [savedIdMap,  setSavedIdMap]  = useState({})   // activeIdx → Railway save id
  const [saving,      setSaving]      = useState(false)
  const [sharing,     setSharing]     = useState(false)
  const [compareMode, setCompareMode] = useState(false)
  const [menuOpen,    setMenuOpen]    = useState(false)
  const toast    = useToast()
  const isDesktop = useDesktop()
  const t = useT()

  const total    = selectedFabrics.length
  const ready    = results.length
  const loading  = analysing || (ready === 0 && generating && !promptPreview)
  const isSource = activeIdx === -1
  const active   = isSource ? null : (results[activeIdx] ?? null)

  const viewerSrc = isSource ? roomUrl : active?.imageUrl

  // ── Save (shared helper — used by handleSave and handleWhatsAppShare) ────────
  const _persistSave = async () => {
    const blob = await fetch(active.imageUrl).then(r => r.blob())
    const fd   = new FormData()
    fd.append('image',        blob, 'curtain.png')
    fd.append('fabric_name',  active.fabric.name)
    fd.append('fabric_id',    active.fabric.id)
    fd.append('curtain_type', curtainType)
    const res  = await apiFetch('/saves', { method: 'POST', body: fd })
    if (!res.ok) throw new Error(`Save failed: ${res.status}`)
    const data = await res.json()
    setSaved(prev => new Set(prev).add(activeIdx))
    setSavedIdMap(prev => ({ ...prev, [activeIdx]: data.id }))
    return data.id
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!active || saving) return
    if (saved.has(activeIdx)) {
      setSaved(prev => { const s = new Set(prev); s.delete(activeIdx); return s })
      toast.show(t('app.results.toast_removed'))
      return
    }
    setSaving(true)
    try {
      await _persistSave()
      toast.show(t('app.results.toast_saved'), <IconHeart size={14} filled />)
    } catch {
      toast.show(t('app.results.toast_save_failed'))
    } finally {
      setSaving(false)
    }
  }

  // ── WhatsApp share ────────────────────────────────────────────────────────
  const handleWhatsAppShare = async () => {
    if (!active || sharing) return
    setSharing(true)
    try {
      // Ensure there's a stable hosted URL — save now if we haven't yet
      const saveId = savedIdMap[activeIdx] ?? await _persistSave()
      const imageUrl = `${API_BASE}/saves/${saveId}/image`

      const dims = czWidthCm && czHeightCm ? `${czWidthCm} × ${czHeightCm} cm` : null

      const curtainLabel = t(`app.configure.${curtainType}`) || curtainType

      const lines = [
        'שלום ויקי! 👋',
        'השתמשתי בכלי ההדמיה שלך ואני אוהב/ת את האפשרות הזו:',
        '',
        `🧵 ${active.fabric.name} (${active.fabric.collection} · ${curtainLabel})`,
        dims && `🪟 חלון: ${dims}`,
        '',
        '📸 תצוגה מקדימה:',
        imageUrl,
        '',
        'אפשר לדבר על זה? אשמח לייעוץ שלך!',
      ].filter(l => l !== false && l !== null && l !== undefined).join('\n')

      const waUrl = `https://wa.me/${VICKY_WHATSAPP}?text=${encodeURIComponent(lines)}`
      window.open(waUrl, '_blank', 'noopener,noreferrer')
    } catch {
      toast.show('Could not prepare WhatsApp message — please try again.')
    } finally {
      setSharing(false)
    }
  }

  // ── Swipe ─────────────────────────────────────────────────────────────────
  const [touchStart, setTouchStart] = useState(null)
  const handleTouchStart = e => setTouchStart(e.touches[0].clientX)
  const handleTouchEnd   = e => {
    if (touchStart === null) return
    const delta = touchStart - e.changedTouches[0].clientX
    if (Math.abs(delta) > 50) {
      setActiveIdx(prev =>
        delta > 0 ? Math.min(prev + 1, results.length - 1) : Math.max(prev - 1, -1)
      )
    }
    setTouchStart(null)
  }

  // ── Status badge ──────────────────────────────────────────────────────────
  const statusBadge = analysing
    ? <span style={{ fontSize: '0.68rem', color: 'var(--accent)', fontWeight: 600 }}>{t('app.results.analysing_status')}</span>
    : promptPreview
      ? <span style={{ fontSize: '0.68rem', color: 'var(--accent)', fontWeight: 700 }}>⏸ Paused</span>
      : generating
        ? <span style={{ fontSize: '0.68rem', color: 'var(--accent)' }}>{ready}/{total} ready…</span>
        : <span style={{ fontSize: '0.68rem', color: 'var(--text-3)' }}>{ready} {t('app.results.gen_progress_of')} {total}</span>

  // ── Action row ────────────────────────────────────────────────────────────
  const actionRow = (
    <div style={{ display: 'flex', gap: 8, padding: '10px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
      <ActionBtn
        icon={IconHeart}
        label={saving ? '…' : saved.has(activeIdx) ? t('app.results.saved') : t('app.results.save')}
        onClick={handleSave}
        disabled={isSource || saving}
        active={saved.has(activeIdx)}
        color="rgb(210,70,80)"
      />
      <ActionBtn
        icon={IconWhatsApp}
        label={sharing ? '…' : 'WhatsApp'}
        onClick={handleWhatsAppShare}
        disabled={isSource || sharing}
        active={false}
        color="#25D366"
      />
      <ActionBtn
        icon={IconGrid}
        label={t('app.results.compare')}
        onClick={() => setCompareMode(true)}
        disabled={false}
        active={false}
      />
    </div>
  )

  // ── Thumbnail grid ────────────────────────────────────────────────────────
  const thumbnailGrid = (cols) => (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 10, padding: '0 16px' }}>
      <SourceThumbnail roomUrl={roomUrl} selected={activeIdx === -1} onSelect={() => setActiveIdx(-1)} />
      {results.map((r, i) => (
        <CompareThumbnail
          key={r.fabric.id}
          result={r} rank={i}
          selected={i === activeIdx}
          onSelect={() => setActiveIdx(i)}
        />
      ))}
    </div>
  )

  // ── Image viewer ──────────────────────────────────────────────────────────
  const imageViewer = (height, compact) => (
    <div
      style={{
        height,
        position: 'relative', background: 'var(--surface-ink)', flexShrink: 0,
        transition: 'height var(--duration) var(--ease)',
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <img
        src={viewerSrc}
        alt={isSource ? 'Original' : active?.fabric.name}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />

      {/* Label overlay */}
      {!compact && (
        <div style={{
          position: 'absolute', top: 12, left: 12,
          background: 'rgba(250,246,240,.92)', backdropFilter: 'blur(12px)',
          border: '1px solid rgba(26,22,16,.1)', borderRadius: 'var(--r-sm)',
          padding: '7px 12px',
        }}>
          {isSource ? (
            <>
              <div style={{ fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 1 }}>{t('app.results.before')}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 500, color: 'var(--ink)' }}>{t('app.results.original_room')}</div>
            </>
          ) : (
            <>
              <div style={{ fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 1 }}>
                {active.fabric.collection} · {active.fabric.type}
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 500, color: 'var(--ink)', lineHeight: 1.1 }}>
                {active.fabric.name}
              </div>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-2)', marginTop: 2 }}>
                ₪{active.fabric.price_per_m} / m
              </div>
            </>
          )}
        </div>
      )}

      {/* Swipe dots */}
      <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6 }}>
        <div onClick={() => setActiveIdx(-1)} style={{ width: activeIdx === -1 ? 20 : 8, height: 4, borderRadius: 2, cursor: 'pointer', background: activeIdx === -1 ? 'rgba(255,255,255,.7)' : 'rgba(255,255,255,.3)', transition: 'all var(--duration)' }} />
        {results.map((_, i) => (
          <div key={i} onClick={() => setActiveIdx(i)} style={{ width: i === activeIdx ? 20 : 8, height: 4, borderRadius: 2, cursor: 'pointer', background: i === activeIdx ? '#fff' : 'rgba(255,255,255,.4)', transition: 'all var(--duration)' }} />
        ))}
        {generating && <div style={{ width: 8, height: 4, borderRadius: 2, background: 'rgba(255,255,255,.2)' }} />}
      </div>
    </div>
  )

  // ─────────────────────────────────────────────────────────────────────────────

  if (isDesktop && ready > 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)', position: 'relative' }}>
        <MobileMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
        <style>{CSS}</style>

        {/* Header */}
        {compareMode ? (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 18px', height: 52,
            borderBottom: '1px solid var(--border)', flexShrink: 0, background: 'var(--bg)',
          }}>
            <div>
              <div style={{ fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
                {isSource ? t('app.results.before') : t('app.results.compare_peek')}
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 500, color: 'var(--ink)' }}>
                {isSource ? t('app.results.original_room') : active?.fabric.name}
              </div>
            </div>
            <button
              onClick={() => setCompareMode(false)}
              style={{ padding: '8px 18px', borderRadius: 'var(--r-full)', background: 'var(--accent)', color: '#fff', fontSize: '0.7rem', fontWeight: 700, border: 'none', cursor: 'pointer' }}
            >
              {t('app.results.use_this')}
            </button>
          </div>
        ) : (
          <TopBar title={t('app.results.title')} onBack={onBack} right={statusBadge} />
        )}

        {!compareMode && generating && <GenBar ready={ready} total={total} />}

        {/* ── Desktop: two-column layout ── */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 340px', overflow: 'hidden' }}>

          {/* Left: large image viewer */}
          <div style={{ position: 'relative', background: 'var(--surface-ink)', overflow: 'hidden' }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <img
              src={viewerSrc}
              alt={isSource ? 'Original' : active?.fabric.name}
              style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
            />

            {/* Label overlay */}
            {!compareMode && (
              <div style={{
                position: 'absolute', top: 16, left: 16,
                background: 'rgba(250,246,240,.92)', backdropFilter: 'blur(12px)',
                border: '1px solid rgba(26,22,16,.1)', borderRadius: 'var(--r-sm)',
                padding: '8px 14px',
              }}>
                {isSource ? (
                  <>
                    <div style={{ fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 1 }}>{t('app.results.before')}</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 500, color: 'var(--ink)' }}>{t('app.results.original_room')}</div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 1 }}>
                      {active.fabric.collection} · {active.fabric.type}
                    </div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 500, color: 'var(--ink)', lineHeight: 1.1 }}>
                      {active.fabric.name}
                    </div>
                    <div style={{ fontSize: '0.66rem', color: 'var(--text-2)', marginTop: 3 }}>
                      ₪{active.fabric.price_per_m} / m
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Swipe dots (clickable nav on desktop too) */}
            <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 8 }}>
              <div onClick={() => setActiveIdx(-1)} style={{ width: activeIdx === -1 ? 24 : 10, height: 5, borderRadius: 3, cursor: 'pointer', background: activeIdx === -1 ? 'rgba(255,255,255,.8)' : 'rgba(255,255,255,.3)', transition: 'all var(--duration)' }} />
              {results.map((_, i) => (
                <div key={i} onClick={() => setActiveIdx(i)} style={{ width: i === activeIdx ? 24 : 10, height: 5, borderRadius: 3, cursor: 'pointer', background: i === activeIdx ? '#fff' : 'rgba(255,255,255,.4)', transition: 'all var(--duration)' }} />
              ))}
            </div>
          </div>

          {/* Side panel: actions + fabric switcher */}
          <div style={{
            borderInlineStart: '1px solid var(--border)',
            display: 'flex', flexDirection: 'column',
            background: 'var(--bg)',
            overflow: 'hidden',
          }}>
            {/* Active fabric info */}
            {!compareMode && active && (
              <div style={{
                padding: '16px 16px 12px',
                borderBottom: '1px solid var(--border)',
                flexShrink: 0,
              }}>
                <div style={{ fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 4 }}>
                  {active.fabric.collection} · {active.fabric.type}
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 400, color: 'var(--ink)', lineHeight: 1.1 }}>
                  {active.fabric.name}
                </div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--ink)', marginTop: 6 }}>
                  ₪{active.fabric.price_per_m}<span style={{ fontWeight: 400, color: 'var(--text-3)', fontSize: '0.68rem' }}> / m</span>
                </div>
              </div>
            )}

            {!compareMode && actionRow}

            {/* Fabric picker grid */}
            <div className="scroll" style={{
              flex: 1,
              padding: '12px 16px',
              paddingBottom: 'calc(var(--nav-height) + 12px)',
              overflowY: 'auto',
            }}>
              <div style={{ fontSize: '0.56rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 10 }}>
                {compareMode ? t('app.results.select_to_compare') : t('app.results.compare_options')}
              </div>
              {thumbnailGrid(2)}

              {/* New room */}
              {!compareMode && (
                <div style={{ padding: '14px 0 0' }}>
                  <button onClick={onNewRoom} style={{
                    width: '100%', padding: '12px', borderRadius: 'var(--r-md)',
                    background: 'none', border: '1px solid var(--border)',
                    color: 'var(--text-2)', fontSize: '0.78rem', fontWeight: 500,
                    cursor: 'pointer',
                  }}>
                    {t('app.results.start_new_room')}
                  </button>
                </div>
              )}
            </div>

            {compareMode && (
              <div style={{ padding: '12px 16px calc(var(--nav-height) + 12px)', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
                <button onClick={() => setCompareMode(false)} style={{
                  width: '100%', padding: '12px', borderRadius: 'var(--r-md)',
                  background: 'var(--accent)', color: '#fff',
                  border: 'none', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                }}>
                  {t('app.results.use_this')} →
                </button>
              </div>
            )}
          </div>
        </div>

        <Toast visible={toast.visible} message={toast.message} icon={toast.icon} />
        {!compareMode && <BottomNav activeIcon={IconSparkles} activeLabel={t('app.results.nav_label')} onMenu={() => setMenuOpen(true)} />}
      </div>
    )
  }

  // ── Mobile / loading / error layout ──────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)', position: 'relative' }}>
      <MobileMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      <style>{CSS}</style>

      {/* Header */}
      {compareMode ? (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 18px', height: 52,
          borderBottom: '1px solid var(--border)', flexShrink: 0, background: 'var(--bg)',
        }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
              {isSource ? t('app.results.before') : t('app.results.compare_peek')}
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 500, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {isSource ? t('app.results.original_room') : active?.fabric.name}
            </div>
          </div>
          <button
            onClick={() => setCompareMode(false)}
            style={{ padding: '8px 18px', borderRadius: 'var(--r-full)', background: 'var(--accent)', color: '#fff', fontSize: '0.7rem', fontWeight: 700, border: 'none', cursor: 'pointer' }}
          >
            {t('app.results.use_this')}
          </button>
        </div>
      ) : (
        <TopBar title={t('app.results.title')} onBack={onBack} right={statusBadge} />
      )}

      {/* Loading */}
      {loading && !error && (
        <ProgressSteps analysing={analysing} generating={generating} ready={ready} total={total} />
      )}

      {/* Debug prompt preview */}
      {promptPreview && !ready && (
        <PromptPreview preview={promptPreview} onContinue={onContinue} onCancel={onCancelPreview} />
      )}

      {/* Error with no results */}
      {!loading && ready === 0 && error && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 }}>
          <div style={{ fontSize: '2rem' }}>⚠️</div>
          <div style={{ fontSize: '.82rem', color: 'var(--ink)', fontWeight: 600, textAlign: 'center' }}>{t('app.results.gen_failed')}</div>
          <div style={{ fontSize: '.72rem', color: 'var(--text-2)', textAlign: 'center' }}>{error}</div>
          <button onClick={onBack} style={{ marginTop: 8, padding: '10px 24px', borderRadius: 'var(--r-md)', background: 'var(--ink)', color: 'var(--text-on-ink)', border: 'none', fontSize: '.8rem', fontWeight: 600, cursor: 'pointer' }}>
            {t('app.results.try_again')}
          </button>
        </div>
      )}

      {/* Results view */}
      {ready > 0 && (
        <>
          {!compareMode && generating && <GenBar ready={ready} total={total} />}

          {/* Main image viewer */}
          {imageViewer(
            compareMode ? 'min(28vh, 200px)' : 'min(40vh, 290px)',
            compareMode
          )}

          {/* Action row */}
          {!compareMode && actionRow}

          {/* Scrollable lower section */}
          <div className="scroll" style={{ flex: 1, paddingBottom: compareMode ? 16 : 'calc(var(--nav-height) + 16px)' }}>
            {!compareMode && (
              <div style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-3)', padding: '12px 18px 8px' }}>
                {t('app.results.compare_options')}
              </div>
            )}
            {thumbnailGrid(2)}

            {!compareMode && (
              <div style={{ padding: '14px 16px 0' }}>
                <button onClick={onNewRoom} style={{
                  width: '100%', padding: '12px', borderRadius: 'var(--r-md)',
                  background: 'none', border: '1px solid var(--border)',
                  color: 'var(--text-2)', fontSize: '0.78rem', fontWeight: 500,
                  cursor: 'pointer',
                }}>
                  + Start new room
                </button>
              </div>
            )}
          </div>
        </>
      )}

      <Toast visible={toast.visible} message={toast.message} icon={toast.icon} />
      {!compareMode && <BottomNav activeIcon={IconSparkles} activeLabel={t('app.results.nav_label')} />}
    </div>
  )
}
