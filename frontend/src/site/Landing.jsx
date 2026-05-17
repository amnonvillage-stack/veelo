import { useEffect } from 'react'
import Hero from './sections/Hero.jsx'
import AboutVicky from './sections/AboutVicky.jsx'
import VeeloTeaser from './sections/VeeloTeaser.jsx'
import ContactBlock from './sections/ContactBlock.jsx'

// Landing — the long-scroll page at /. Each section is independently rendered,
// so we can split-bundle later if any single section grows heavy
// (e.g. portfolio gallery in Phase 2).

export default function Landing() {
  // ── Hash scroll after SPA navigation ──────────────────────────────────────
  // When arriving from the Veelo app via window.location.href = '/#section',
  // the browser tries to scroll to the hash before React has rendered anything
  // and silently gives up. We re-attempt after mount (and once more after a
  // short delay to survive any layout shift from lazy images).
  useEffect(() => {
    const id = window.location.hash.slice(1)
    if (!id) return

    const scrollToId = () => {
      const el = document.getElementById(id)
      if (el) { el.scrollIntoView({ behavior: 'smooth' }); return true }
      return false
    }

    if (!scrollToId()) {
      const timer = setTimeout(scrollToId, 120)
      return () => clearTimeout(timer)
    }
  }, [])

  return (
    <>
      <section><Hero /></section>
      <section id="studio"><AboutVicky /></section>
      <section id="veelo"><VeeloTeaser /></section>
      <section id="contact"><ContactBlock /></section>
    </>
  )
}
