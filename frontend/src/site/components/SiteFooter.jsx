import { useT } from '../../i18n/useT.js'

// SiteFooter — minimal contact echo + social + ©.
// Real contact lives in <ContactBlock> above the footer.
//
// TODO(content): replace placeholder Facebook/Instagram URLs with the real ones
// (provided 2026-05-07: FB + IG handles to be supplied).

const SOCIAL = {
  facebook:  'https://www.facebook.com/',  // TODO(content): real handle
  instagram: 'https://www.instagram.com/', // TODO(content): real handle
}

function FacebookIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  )
}

export default function SiteFooter() {
  const t = useT()

  return (
    <footer className="site-footer">
      <div className="container site-footer__inner">
        <div>
          <div className="site-footer__brand">VICKY&nbsp;ISRAEL</div>
          <div className="site-footer__rights">{t('footer.rights')}</div>
        </div>

        <div className="site-footer__social">
          <a href={SOCIAL.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
            <InstagramIcon />
          </a>
          <a href={SOCIAL.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook">
            <FacebookIcon />
          </a>
        </div>
      </div>
    </footer>
  )
}
