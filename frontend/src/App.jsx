import { useState, useCallback, useEffect, useRef } from 'react'
import Landing          from './screens/Landing.jsx'
import ConfigureCurtain from './screens/ConfigureCurtain.jsx'
import Email            from './screens/Email.jsx'
import Capture          from './screens/Capture.jsx'
import MarkWindow       from './screens/MarkWindow.jsx'
import ResultsV13       from './screens/ResultsV13.jsx'
import Sent             from './screens/Sent.jsx'
import Admin            from './screens/Admin.jsx'

// ── App-level shared state ────────────────────────────────────────────────────
// v1.3 flow:
//   landing → configure → email → capture → mark → results → sent
//
// Why orchestration lives here (not in a screen):
//   The generation pipeline (analyse → generate) is shared between two paths:
//     1. First-time render after MarkWindow.onDone
//     2. Fabric swaps from inside ResultsV13
//   Centralising it here means a single source of truth for the simulation +
//   no duplicated /analyze and /generate calls scattered across screens.
//
// State that persists across screens (so the user can press back without losing
// data) is split logically — config, contact, photo, geometry, results.
//
// Admin screen is reachable from Landing (gear icon) and is fully out-of-band;
// it doesn't share the configurator state.

export default function App() {
  const [screen, setScreen] = useState('landing')

  // ── Configure (curtain type + fabric + hanger + wings) ──────────────────────
  const [curtainType, setCurtainType] = useState('')
  const [fabric,      setFabric]      = useState(null)
  const [hanger,      setHanger]      = useState(null)
  const [wings,       setWings]       = useState(2)

  // Catalogue caches — used by ResultsV13 swap drawers without re-fetching.
  // Populated when fabric/hanger are chosen on ConfigureCurtain.
  const [fabricChoices, setFabricChoices] = useState([])
  const [hangerChoices, setHangerChoices] = useState([])

  // ── Email ──────────────────────────────────────────────────────────────────
  const [customerEmail, setCustomerEmail] = useState('')

  // ── Photo ──────────────────────────────────────────────────────────────────
  const [roomFile, setRoomFile] = useState(null)
  const [roomUrl,  setRoomUrl]  = useState(null)

  // ── Window marking ─────────────────────────────────────────────────────────
  const [curtainPoints, setCurtainPoints] = useState([])
  const [czWidthCm,     setCzWidthCm]     = useState('')
  const [czHeightCm,    setCzHeightCm]    = useState('')

  // ── Generation result ──────────────────────────────────────────────────────
  const [analysis,   setAnalysis]   = useState(null)
  const [simulation, setSimulation] = useState(null)   // { fabric, imageUrl }
  const [genError,   setGenError]   = useState(null)
  const [analysing,  setAnalysing]  = useState(false)
  const [generating, setGenerating] = useState(false)

  // ── Debug mode (admin-only) ────────────────────────────────────────────────
  const [debugMode, setDebugMode] = useState(false)
  // When debugMode=true, runGeneration pauses here after dry_run and waits
  // for the user to confirm before calling the real /generate endpoint.
  const [debugPreview, setDebugPreview] = useState(null) // { prompt, model, fabric }

  // Latest-only guard to avoid stale regen results overwriting fresh ones
  const genTokenRef = useRef(0)
  // Stores the args needed to resume real generation after debug confirmation
  const pendingGenRef = useRef(null)

  // ── Navigation helpers ─────────────────────────────────────────────────────
  const goTo = useCallback(s => setScreen(s), [])

  // Hard reset — used by "Design another" on Sent.
  const startOver = useCallback(() => {
    if (roomUrl?.startsWith('blob:')) URL.revokeObjectURL(roomUrl)
    if (simulation?.imageUrl?.startsWith('blob:')) URL.revokeObjectURL(simulation.imageUrl)
    setCurtainType(''); setFabric(null); setHanger(null); setWings(2)
    setFabricChoices([]); setHangerChoices([])
    setCustomerEmail('')
    setRoomFile(null); setRoomUrl(null)
    setCurtainPoints([]); setCzWidthCm(''); setCzHeightCm('')
    setAnalysis(null); setSimulation(null); setGenError(null)
    setDebugPreview(null); pendingGenRef.current = null
    setAnalysing(false); setGenerating(false)
    setScreen('landing')
  }, [roomUrl, simulation])

  // ── Step 1: Configure ──────────────────────────────────────────────────────
  const handleConfigureContinue = useCallback(({ curtainType, fabric, hanger, wings }) => {
    setCurtainType(curtainType)
    setFabric(fabric)
    setHanger(hanger)
    setWings(wings)
    setScreen('email')
    // Fetch catalogues for later swap drawers — fire-and-forget
    fetch(`/catalog?type=${encodeURIComponent(curtainType)}`)
      .then(r => r.ok ? r.json() : []).then(setFabricChoices).catch(() => {})
    fetch(`/hangers?curtain_type=${encodeURIComponent(curtainType)}`)
      .then(r => r.ok ? r.json() : []).then(setHangerChoices).catch(() => {})
  }, [])

  // ── Step 2: Email ──────────────────────────────────────────────────────────
  const handleEmailContinue = useCallback((email) => {
    setCustomerEmail(email)
    setScreen('capture')
  }, [])

  // ── Step 3: Capture photo ──────────────────────────────────────────────────
  const handleRoomPicked = useCallback((file, url) => {
    if (roomUrl?.startsWith('blob:')) URL.revokeObjectURL(roomUrl)
    setRoomFile(file)
    setRoomUrl(url)
    setCurtainPoints([])
    setAnalysis(null)
    setSimulation(null)
    setGenError(null)
    setScreen('mark')
  }, [roomUrl])

  // ── Generation pipeline (analyse + generate) ───────────────────────────────
  // When debugMode=false (normal): analyse → generate in one shot.
  // When debugMode=true: analyse → dry_run (get prompt text) → pause.
  //   User inspects prompt in ResultsV13 debug panel → clicks confirm →
  //   handleConfirmGenerate() resumes with the real /generate call.

  // Step B-real: fire the actual /generate call.
  // Called either immediately (debugMode=false) or after user confirmation.
  const fireGenerate = useCallback(async (myToken, chosenFabric, points, wCm, hCm, analysisResult) => {
    const fd = new FormData()
    fd.append('room_image',   roomFile)
    fd.append('fabric_id',    chosenFabric.id)
    fd.append('curtain_type', curtainType)
    fd.append('cz_width_cm',  wCm || '')
    fd.append('cz_height_cm', hCm || '')
    if (points?.length === 4) {
      fd.append('window_points', JSON.stringify(points))
      fd.append('curtain_zone',  JSON.stringify(points))
    }
    if (analysisResult) fd.append('analysis_json', JSON.stringify(analysisResult))

    try {
      const res = await fetch('/generate', { method: 'POST', body: fd })
      if (!res.ok) {
        let reason = `HTTP ${res.status}`
        try { const j = await res.json(); reason = j.error || reason } catch {}
        throw new Error(reason)
      }
      const blob = await res.blob()
      if (myToken !== genTokenRef.current) return   // stale guard
      setSimulation(prev => {
        if (prev?.imageUrl?.startsWith('blob:')) URL.revokeObjectURL(prev.imageUrl)
        return { fabric: chosenFabric, imageUrl: URL.createObjectURL(blob) }
      })
    } catch (err) {
      console.error(err)
      if (myToken === genTokenRef.current) setGenError(err.message || String(err))
    } finally {
      if (myToken === genTokenRef.current) setGenerating(false)
    }
  }, [roomFile, curtainType])

  const runGeneration = useCallback(async (chosenFabric, points, wCm, hCm) => {
    if (!roomFile || !chosenFabric) return

    const myToken = ++genTokenRef.current
    setGenerating(true)
    setGenError(null)
    setDebugPreview(null)
    pendingGenRef.current = null

    let analysisResult = analysis
    try {
      // Step A: analyse — only first time (cached on subsequent regens)
      if (!analysisResult) {
        setAnalysing(true)
        try {
          const fd = new FormData()
          fd.append('room_image', roomFile)
          if (points?.length === 4) fd.append('selection', JSON.stringify(points))
          const r = await fetch('/analyze', { method: 'POST', body: fd })
          const data = r.ok ? await r.json() : null
          if (data?.ok && data.analysis) {
            analysisResult = data.analysis
            if (myToken === genTokenRef.current) setAnalysis(analysisResult)
          }
        } catch (e) {
          console.warn('Analysis failed, continuing without it:', e)
        } finally {
          if (myToken === genTokenRef.current) setAnalysing(false)
        }
      }

      // Step B: debug dry-run OR real generate
      if (debugMode) {
        // Fetch the prompt text without calling Gemini — so the user can inspect it
        const fd = new FormData()
        fd.append('room_image',   roomFile)
        fd.append('fabric_id',    chosenFabric.id)
        fd.append('curtain_type', curtainType)
        fd.append('cz_width_cm',  wCm || '')
        fd.append('cz_height_cm', hCm || '')
        if (points?.length === 4) {
          fd.append('window_points', JSON.stringify(points))
          fd.append('curtain_zone',  JSON.stringify(points))
        }
        if (analysisResult) fd.append('analysis_json', JSON.stringify(analysisResult))
        fd.append('dry_run', '1')

        const res = await fetch('/generate', { method: 'POST', body: fd })
        if (myToken !== genTokenRef.current) return
        if (res.ok) {
          const data = await res.json()
          if (myToken !== genTokenRef.current) return
          // Pause: store preview and the args needed to resume
          setDebugPreview({ prompt: data.prompt, model: data.model, fabric: data.fabric })
          pendingGenRef.current = { myToken, chosenFabric, points, wCm, hCm, analysisResult }
          setGenerating(false)   // stop spinner — user is inspecting
        } else {
          throw new Error(`Dry-run failed: HTTP ${res.status}`)
        }
      } else {
        // Normal path: fire immediately
        await fireGenerate(myToken, chosenFabric, points, wCm, hCm, analysisResult)
      }
    } catch (err) {
      console.error(err)
      if (myToken === genTokenRef.current) {
        setGenError(err.message || String(err))
        setGenerating(false)
      }
    }
  }, [roomFile, curtainType, analysis, debugMode, fireGenerate])

  // Called from ResultsV13 "Run generation" button when debugMode is active
  const handleConfirmGenerate = useCallback(async () => {
    const pending = pendingGenRef.current
    if (!pending) return
    pendingGenRef.current = null
    setDebugPreview(null)
    setGenerating(true)
    setGenError(null)
    await fireGenerate(
      pending.myToken, pending.chosenFabric,
      pending.points, pending.wCm, pending.hCm, pending.analysisResult,
    )
  }, [fireGenerate])

  // ── Step 4: Mark window → kick off generation ──────────────────────────────
  const handleMarkDone = useCallback(({ points, widthCm, heightCm }) => {
    setCurtainPoints(points)
    setCzWidthCm(widthCm)
    setCzHeightCm(heightCm)
    setSimulation(null)
    setGenError(null)
    setScreen('results')
    runGeneration(fabric, points, widthCm, heightCm)
  }, [fabric, runGeneration])

  // ── Results: fabric swap → regenerate ──────────────────────────────────────
  const handleChangeFabric = useCallback((newFabric) => {
    if (!newFabric || newFabric.id === fabric?.id) return
    setFabric(newFabric)
    runGeneration(newFabric, curtainPoints, czWidthCm, czHeightCm)
  }, [fabric, curtainPoints, czWidthCm, czHeightCm, runGeneration])

  // Hanger swap is metadata-only (no regen)
  const handleChangeHanger = useCallback((newHanger) => {
    setHanger(newHanger)
  }, [])

  // ── Send inquiry → POST /inquiry → confirmation ────────────────────────────
  const handleSendInquiry = useCallback(async ({ priceEstimate }) => {
    if (!simulation?.imageUrl || !roomFile) {
      throw new Error('Missing simulation or source image')
    }

    // Convert simulation blob URL back to a Blob for upload
    const simResp = await fetch(simulation.imageUrl)
    const simBlob = await simResp.blob()

    const fd = new FormData()
    fd.append('source_image',     roomFile)
    fd.append('simulation_image', simBlob, 'simulation.png')
    fd.append('customer_email',   customerEmail)
    fd.append('curtain_type',     curtainType)
    fd.append('fabric_id',        fabric?.id || '')
    fd.append('hanger_id',        hanger?.id || '')
    fd.append('wings',            String(wings))
    fd.append('width_cm',         czWidthCm)
    fd.append('height_cm',        czHeightCm)
    fd.append('window_points',    JSON.stringify(curtainPoints))
    fd.append('price_estimate',   priceEstimate || '')

    const r = await fetch('/inquiry', { method: 'POST', body: fd })
    if (!r.ok) {
      let reason = `HTTP ${r.status}`
      try { const j = await r.json(); reason = j.error || reason } catch {}
      throw new Error(reason)
    }
    setScreen('sent')
  }, [
    simulation, roomFile, customerEmail, curtainType,
    fabric, hanger, wings, czWidthCm, czHeightCm, curtainPoints,
  ])

  // ── Render ─────────────────────────────────────────────────────────────────
  const screens = {
    landing: (
      <Landing
        onStart={() => goTo('configure')}
        onAdmin={() => goTo('admin')}
      />
    ),
    configure: (
      <ConfigureCurtain
        initialType={curtainType}
        initialFabric={fabric}
        initialHanger={hanger}
        initialWings={wings}
        onBack={() => goTo('landing')}
        onContinue={handleConfigureContinue}
      />
    ),
    email: (
      <Email
        initialEmail={customerEmail}
        onBack={() => goTo('configure')}
        onContinue={handleEmailContinue}
      />
    ),
    capture: (
      <Capture
        onRoomPicked={handleRoomPicked}
        onAdmin={() => goTo('admin')}
      />
    ),
    mark: (
      <MarkWindow
        roomUrl={roomUrl}
        initialPoints={curtainPoints}
        initialWidthCm={czWidthCm}
        initialHeightCm={czHeightCm}
        curtainType={curtainType}
        onBack={() => goTo('capture')}
        onDone={handleMarkDone}
      />
    ),
    results: (
      <ResultsV13
        simulation={simulation}
        generating={generating}
        analysing={analysing}
        error={genError}
        curtainType={curtainType}
        widthCm={czWidthCm}
        heightCm={czHeightCm}
        fabric={fabric}
        hanger={hanger}
        wings={wings}
        fabricChoices={fabricChoices}
        hangerChoices={hangerChoices}
        onChangeFabric={handleChangeFabric}
        onChangeHanger={handleChangeHanger}
        onSend={handleSendInquiry}
        onBack={() => goTo('mark')}
        onNewRoom={startOver}
        debugMode={debugMode}
        debugPreview={debugPreview}
        onConfirmGenerate={handleConfirmGenerate}
      />
    ),
    sent: (
      <Sent
        email={customerEmail}
        onStartOver={startOver}
      />
    ),
    admin: (
      <Admin
        debugMode={debugMode}
        onToggleDebug={() => setDebugMode(m => !m)}
        onBack={() => goTo('landing')}
      />
    ),
  }

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {screens[screen]}
    </div>
  )
}
