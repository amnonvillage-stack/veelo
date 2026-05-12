import { useT } from '../../i18n/useT.js'

// ContactBlock — primary email CTA with a quiet WhatsApp adjunct.
// Email is the lead because a written brief surfaces qualified intent;
// WhatsApp is offered as a faster alternative for warm leads.
//
// Reuses the same WhatsApp number Veelo already uses for inquiries
// (see backend/.env.example PUBLIC_BASE_URL config).
//
// TODO(content): replace EMAIL with Vicky's real address.

const EMAIL = 'hello@vickyisrael.com' // TODO(content): real address
const WHATSAPP_NUMBER = '972523770639' // matches Veelo

function emailHref() {
  return `mailto:${EMAIL}`
}

function whatsappHref(text) {
  const base = `https://wa.me/${WHATSAPP_NUMBER}`
  return text ? `${base}?text=${encodeURIComponent(text)}` : base
}

export default function ContactBlock() {
  const t = useT()
  const waText = t('contact.headline')

  return (
    <section className="contact section" id="contact">
      <div className="container">
        <div className="contact__inner">
          <p className="eyebrow">{t('contact.eyebrow')}</p>
          <h2 className="display-2">{t('contact.headline')}</h2>
          <p className="lede" style={{ marginInline: 'auto', marginBlockStart: '16px' }}>
            {t('contact.lede')}
          </p>

          <div className="contact__cta-row">
            <a href={emailHref()} className="btn btn-primary">
              {t('contact.email_cta')}
            </a>
            <a
              href={whatsappHref(waText)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
            >
              {t('contact.whatsapp_cta')}
            </a>
          </div>

          <p className="contact__hint">{t('contact.whatsapp_hint')}</p>

          <p className="contact__consent">
            {t('contact.consent')}{' '}
            <a href="/privacy.html">{t('footer.privacy')}</a>
            {' '}
            <span aria-hidden="true">&amp;</span>
            {' '}
            <a href="/terms.html">{t('footer.terms')}</a>.
          </p>
        </div>
      </div>
    </section>
  )
}
