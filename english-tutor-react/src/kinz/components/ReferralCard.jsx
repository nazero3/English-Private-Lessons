import { useState } from 'react'
import { WHATSAPP } from '../lib/format'

export default function ReferralCard({ familyCode }) {
  const [copied, setCopied] = useState(false)
  const code = (familyCode || '').toUpperCase()

  const copy = async () => {
    if (!code) return
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  const shareText = `مرحباً، أدعوكم لعائلة كينز. رمز العائلة: ${code || '—'}`

  return (
    <details className="referral-fold">
      <summary>أصدقاء كينز — ادعُ عائلة واكسب نقاطاً</summary>
      <p className="muted">شاركوا الرمز. تُضاف المكافأة عند تسجيل طالب جديد عبره.</p>
      <div className="referral-code" aria-label="رمز الإحالة">
        {code || 'سيظهر الرمز بعد تفعيل الحساب'}
      </div>
      <div className="btn-row" style={{ marginTop: '0.85rem' }}>
        <button type="button" className="btn btn-navy" onClick={copy} disabled={!code}>
          {copied ? 'تم النسخ' : 'نسخ الرمز'}
        </button>
        <a
          className="btn btn-whatsapp"
          href={`${WHATSAPP}?text=${encodeURIComponent(shareText)}`}
          target="_blank"
          rel="noreferrer"
        >
          واتساب
        </a>
      </div>
      <p className="visually-hidden" aria-live="polite">
        {copied ? 'تم نسخ رمز العائلة' : ''}
      </p>
    </details>
  )
}
