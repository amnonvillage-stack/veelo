import { useState, useCallback } from 'react'
import { apiFetch } from '../api.js'
import Capture     from './screens/Capture.jsx'
import CurtainType from './screens/CurtainType.jsx'
import Configure   from './screens/Configure.jsx'
import Catalog     from './screens/Catalog.jsx'
import Results     from './screens/Results.jsx'
import Admin       from './screens/Admin.jsx'

// ── Veelo PWA root ───────────────────────────────────────────────────────────
// Hand-rolled state machine:
//   capture → curtain-type → (precision?) → catalog → results
//
// Precision mode is opt-in: user toggles it in the CurtainType screen
// when their photo has multiple windows or they want to mark the exact area.
//
// The root div carries `.veelo-app-root` (defined in tokens.css) which gives
// this experience a locked viewport (no body scroll, safe-area insets) without
// imposing the same on the marketing site at `/`.

export default function VeeloApp() {
  const [screen, setScreen] = useState('capture')

  // Room
  const [roomFile, setRoomFile] = useState(null)
  const [roomUrl,  setRoomUrl]  = useState(null)
  const [analysis, setAnalysis] = useState(null)

  // Configure — one quad that defines the curtain area (also used as window reference)
  const [curtainPoints, setCurtainPoints] = useState([])  // [{x,y}] × 4
  const [curtainType,   setCurtainType]   = useState('')
  const [czWidthCm,     setCzWidthCm]     = useState('')
  const [czHeightCm,    setCzHeightCm]    = useState('')

  // Catalog
  const [selectedFabrics, setSelectedFabrics] = useState([])

  // Results
  const [results,   setResults]   = useState([])
  const [genError,  setGenError]  = useState(null)
  const [analysing, setAnalysing] = useState(false)

  // Debug mode
  const [debugMode,     setDebugMode]     = useState(false)
  const [promptPreview, setPromptPreview] = useState(null)

  // ── Navigation ──────────────────────────────────────────────────────────────
  const goTo = useCallback(s => setScreen(s), [])

  // Track whether user went through precision so Catalog knows where to go back
  const [precisionUsed, setPrecisionUsed] = useState(false)

  const handleRoomPicked = useCallback((file, url) => {
    setRoomFile(file)
    setRoomUrl(url)
    setAnalysis(null)
    setCurtainPoints([])
    setCurtainType('')
    setCzWidthCm('')
    setCzHeightCm('')
    setSelectedFabrics([])
    setResults([])
    setGenError(null)
    setAnalysing(false)
    setPromptPreview(null)
    setPrecisionUsed(false)
    setScreen('curtain-type')
  }, [])

  // CurtainType screen: user picked a type and decided on precision mode
  const handleCurtainTypeDone = useCallback((type, wantsPrecision) => {
    setCurtainType(type)
    if (wantsPrecision) {
      setPrecisionUsed(true)
      setScreen('precision')
    } else {
      setCurtainPoints([])
      setCzWidthCm('')
      setCzHeightCm('')
      setPrecisionUsed(false)
      setScreen('catalog')
    }
  }, [])

  // Precision (Configure) screen: user marked corners + optional dimensions
  const handlePrecisionDone = useCallback((pts, wCm, hCm) => {
    setCurtainPoints(pts)
    setCzWidthCm(wCm)
    setCzHeightCm(hCm)
    setAnalysis(null)
    setScreen('catalog')
  }, [])

  // ── Core generation runner ──────────────────────────────────────────────────
  const runGenerations = useCallback(async (fabrics, analysisResult) => {
    const jobs = fabrics.map(async (fabric) => {
      const fd = new FormData()
      fd.append('room_image',   roomFile)
      fd.append('fabric_id',    fabric.id)
      fd.append('curtain_type', curtainType)
      fd.append('cz_width_cm',  czWidthCm  || '')
      fd.append('cz_height_cm', czHeightCm || '')

      // The curtain quad serves double duty:
      //   window_points → disambiguation (which window to target)
      //   curtain_zone  → placement geometry (where the curtain goes)
      if (curtainPoints.length === 4) {
        fd.append('window_points', JSON.stringify(curtainPoints))
        fd.append('curtain_zone',  JSON.stringify(curtainPoints))
      }
      if (analysisResult) fd.append('analysis_json', JSON.stringify(analysisResult))

      const res = await apiFetch('/generate', { method: 'POST', body: fd })
      if (!res.ok) {
        let reason = `HTTP ${res.status}`
        try { const j = await res.json(); reason = j.error || reason } catch {}
        throw new Error(`${fabric.name}: ${reason}`)
      }
      const blob = await res.blob()
      return { fabric, imageUrl: URL.createObjectURL(blob) }
    })

    for (const job of jobs) {
      try {
        const result = await job
        setResults(prev => [...prev, result])
      } catch (err) {
        console.error(err)
        setGenError(`Generation failed for one or more fabrics. ${err.message}`)
      }
    }
  }, [roomFile, curtainType, czWidthCm, czHeightCm, curtainPoints])

  // ── Main generate entry point ───────────────────────────────────────────────
  const handleGenerate = useCallback(async (fabrics) => {
    setSelectedFabrics(fabrics)
    setResults([])
    setGenError(null)
    setAnalysis(null)
    setPromptPreview(null)
    setAnalysing(true)
    setScreen('results')

    // Step 1: Analyse — pass the curtain quad as the window selection
    let analysisResult = null
    try {
      const fd = new FormData()
      fd.append('room_image', roomFile)
      if (curtainPoints.length === 4) fd.append('selection', JSON.stringify(curtainPoints))
      const r    = await apiFetch('/analyze', { method: 'POST', body: fd })
      const data = r.ok ? await r.json() : null
      if (data?.ok && data.analysis) {
        analysisResult = data.analysis
        setAnalysis(analysisResult)
      }
    } catch (e) {
      console.warn('Analysis failed, continuing without it:', e)
    }
    setAnalysing(false)

    // Step 2a: Debug mode — dry-run to inspect prompt before generating
    if (debugMode && fabrics.length > 0) {
      try {
        const fd = new FormData()
        fd.append('room_image',   roomFile)
        fd.append('fabric_id',    fabrics[0].id)
        fd.append('curtain_type', curtainType)
        fd.append('cz_width_cm',  czWidthCm  || '')
        fd.append('cz_height_cm', czHeightCm || '')
        if (curtainPoints.length === 4) {
          fd.append('window_points', JSON.stringify(curtainPoints))
          fd.append('curtain_zone',  JSON.stringify(curtainPoints))
        }
        if (analysisResult) fd.append('analysis_json', JSON.stringify(analysisResult))
        fd.append('dry_run', '1')

        const res  = await apiFetch('/generate', { method: 'POST', body: fd })
        const data = res.ok ? await res.json() : null
        if (data?.ok && data.prompt) {
          setPromptPreview({ prompt: data.prompt, fabrics, analysis: analysisResult })
          return
        }
      } catch (e) {
        console.warn('Dry-run failed, proceeding:', e)
      }
    }

    // Step 2b: Generate
    await runGenerations(fabrics, analysisResult)
  }, [roomFile, curtainType, czWidthCm, czHeightCm, curtainPoints, debugMode, runGenerations])

  // ── Continue after prompt inspection ───────────────────────────────────────
  const handleContinue = useCallback(async () => {
    if (!promptPreview) return
    const { fabrics, analysis: savedAnalysis } = promptPreview
    setPromptPreview(null)
    await runGenerations(fabrics, savedAnalysis)
  }, [promptPreview, runGenerations])

  // ── Render ──────────────────────────────────────────────────────────────────
  const isGenerating = !analysing && !promptPreview && results.length < selectedFabrics.length && !genError

  const screens = {
    capture: (
      <Capture
        onRoomPicked={handleRoomPicked}
        onAdmin={() => goTo('admin')}
      />
    ),
    'curtain-type': (
      <CurtainType
        roomUrl={roomUrl}
        onBack={() => goTo('capture')}
        onDone={handleCurtainTypeDone}
      />
    ),
    precision: (
      <Configure
        roomUrl={roomUrl}
        roomFile={roomFile}
        analysis={analysis}
        initialPoints={curtainPoints}
        onBack={() => goTo('curtain-type')}
        onDone={handlePrecisionDone}
      />
    ),
    catalog: (
      <Catalog
        curtainType={curtainType}
        onBack={() => goTo(precisionUsed ? 'precision' : 'curtain-type')}
        onGenerate={handleGenerate}
      />
    ),
    results: (
      <Results
        results={results}
        selectedFabrics={selectedFabrics}
        roomUrl={roomUrl}
        czWidthCm={czWidthCm}
        czHeightCm={czHeightCm}
        curtainType={curtainType}
        analysing={analysing}
        generating={isGenerating}
        promptPreview={promptPreview}
        onContinue={handleContinue}
        onCancelPreview={() => { setPromptPreview(null); goTo('catalog') }}
        error={genError}
        onBack={() => goTo('catalog')}
        onNewRoom={() => goTo('capture')}
      />
    ),
    admin: (
      <Admin
        debugMode={debugMode}
        onToggleDebug={() => setDebugMode(m => !m)}
        onBack={() => goTo('capture')}
      />
    ),
  }

  return (
    <div className="veelo-app-root" style={{ background: 'var(--bg)' }}>
      {screens[screen]}
    </div>
  )
}
