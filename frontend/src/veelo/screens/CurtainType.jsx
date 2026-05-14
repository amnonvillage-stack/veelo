// ── CurtainType — Step 2 of the Veelo flow ───────────────────────────────────
// User picks a curtain type, and optionally enables precision mode
// (corner-marking + dimensions) for photos with multiple windows.

import { useState } from 'react'
import TopBar    from '../components/TopBar.jsx'
import BottomNav from '../components/BottomNav.jsx'
import { useT } from '../../i18n/useT.js'
import {
  IconCurtainPleated, IconCurtainEyelet,
  IconCurtainRoman, IconCurtainRoller, IconScissors,
} from '../components/icons.jsx'

const CURTAIN_TYPES = [
  { value: 'eyelet',  Icon: IconCurtainEyelet  },
  { value: 'pleated', Icon: IconCurtainPleated },
  { value: 'roman',   Icon: IconCurtainRoman   },
  { value: 'roller',  Icon: IconCurtainRoller  },
]

export default function CurtainType({ roomUrl, onBack, onDone }) {
  const t = useT()
  const [selectedType, setSelectedType] = useState('')
  const [precision,    setPrecision]    = useState(false)

  const stepIndicator = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          height: 4, borderRadius: 2,
          width: i === 1 ? 24 : 14,
          background: i <= 1 ? 'var(--accent)' : 'var(--surface-3)',
          transition: 'width var(--duration)',
        }} />
      ))}
      <span style={{ fontSize: '0.65rem', color: 'var(--text-3)', marginLeft: 4 }}>
        {t('app.curtain_type.step')}
      </span>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)' }}>
      <TopBar title={t('app.curtain_type.title')} onBack={onBack} right={stepIndicator} />

      <div className="scroll" style={{
        flex: 1, overflowY: 'auto',
        padding: '0 20px',
        paddingBottom: 'calc(var(--nav-height) + 20px)',
      }}>

        {/* Room thumbnail — reminds the user which photo they uploaded */}
        {roomUrl && (
          <div style={{
            margin: '16px 0 20px',
            borderRadius: 'var(--r-md)',
            overflow: 'hidden',
            maxHeight: 'min(38vh, 320px)',
            background: 'var(--surface-ink)',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <img
              src={roomUrl} alt="Room"
              style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
            />
          </div>
        )}

        {/* Section label */}
        <div style={{
          fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.14em',
          textTransform: 'uppercase', color: 'var(--text-3)',
          marginBottom: 12, marginTop: roomUrl ? 0 : 16,
        }}>
          {t('app.curtain_type.title')}
        </div>

        {/* 2×2 curtain type grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
          {CURTAIN_TYPES.map(({ value, Icon }) => {
            const active = selectedType === value
            return (
              <button
                key={value}
                onClick={() => setSelectedType(value)}
                style={{
                  padding: '18px 10px',
                  borderRadius: 'var(--r-md)',
                  background: active ? 'var(--accent-dim)' : 'var(--surface)',
                  border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                  color: active ? 'var(--accent)' : 'var(--text-2)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                  cursor: 'pointer',
                  transition: 'all var(--duration)',
                  boxShadow: active ? '0 0 0 2px var(--accent-glow)' : 'none',
                }}
              >
                <Icon size={34} />
                <span style={{
                  fontSize: '0.78rem',
                  fontWeight: active ? 700 : 500,
                  letterSpacing: '0.04em',
                }}>
                  {t(`app.configure.${value}`)}
                </span>
              </button>
            )
          })}
        </div>

        {/* Precision mode toggle */}
        <div
          onClick={() => setPrecision(p => !p)}
          style={{
            background: precision ? 'rgba(192,112,80,.06)' : 'var(--surface)',
            border: `1px solid ${precision ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius: 'var(--r-md)',
            padding: '14px 16px',
            display: 'flex', alignItems: 'flex-start', gap: 14,
            cursor: 'pointer',
            transition: 'all var(--duration)',
            marginBottom: 28,
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: '0.82rem', fontWeight: 600,
              color: precision ? 'var(--accent)' : 'var(--ink)',
              marginBottom: 4,
              display: 'flex', alignItems: 'center', gap: 7,
            }}>
              🎯 {t('app.curtain_type.precision_label')}
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', lineHeight: 1.55 }}>
              {t('app.curtain_type.precision_hint')}
            </div>
          </div>

          {/* Toggle pill */}
          <div style={{
            width: 42, height: 24, borderRadius: 12,
            flexShrink: 0, marginTop: 2,
            background: precision ? 'var(--accent)' : 'var(--surface-3)',
            position: 'relative',
            transition: 'background var(--duration)',
          }}>
            <div style={{
              width: 18, height: 18, borderRadius: '50%', background: '#fff',
              position: 'absolute', top: 3,
              left: precision ? 21 : 3,
              transition: 'left var(--duration)',
              boxShadow: '0 1px 3px rgba(0,0,0,.25)',
            }} />
          </div>
        </div>

        {/* Continue CTA */}
        <button
          onClick={() => selectedType && onDone(selectedType, precision)}
          disabled={!selectedType}
          style={{
            width: '100%', padding: '15px 20px',
            borderRadius: 'var(--r-md)',
            background: selectedType ? 'var(--ink)' : 'var(--surface-3)',
            color: selectedType ? 'var(--text-on-ink)' : 'var(--text-3)',
            fontSize: '0.85rem', fontWeight: 600,
            letterSpacing: '0.04em',
            border: 'none',
            cursor: selectedType ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            transition: 'background var(--duration)',
          }}
        >
          <span>{t('app.curtain_type.continue')}</span>
          <span style={{ opacity: .55, fontSize: '1.1rem' }}>→</span>
        </button>

      </div>

      <BottomNav activeIcon={IconScissors} activeLabel={t('app.curtain_type.nav_label')} />
    </div>
  )
}
