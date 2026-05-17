import Hero from './sections/Hero.jsx'
import AboutVicky from './sections/AboutVicky.jsx'
import VeeloTeaser from './sections/VeeloTeaser.jsx'
import ContactBlock from './sections/ContactBlock.jsx'

// Landing — the long-scroll page at /. Each section is independently rendered,
// so we can split-bundle later if any single section grows heavy
// (e.g. portfolio gallery in Phase 2).

export default function Landing() {
  return (
    <>
      <section><Hero /></section>
      <section id="studio"><AboutVicky /></section>
      <section id="veelo"><VeeloTeaser /></section>
      <section id="contact"><ContactBlock /></section>
    </>
  )
}
