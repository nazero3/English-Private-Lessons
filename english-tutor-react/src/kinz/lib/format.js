export const WHATSAPP = 'https://wa.me/963983888184'
export const INSTAGRAM = 'https://www.instagram.com/kinz.platform'
export const SITE = 'https://kinz-ed.com'
export const TOKEN_KEY = 'kinz_family_token'
export const CHILD_KEY = 'kinz_family_child'
export const KINZ_LOGO = '/kinz/logo.png'

/** Change this later to `/` (or `/family`) when parents get the public app. */
export const KINZ_BASE = '/operations/families'

export function kinzPath(path = '/') {
  if (!path || path === '/') return KINZ_BASE
  return `${KINZ_BASE}${path.startsWith('/') ? path : `/${path}`}`
}

export const TIER_LABEL = {
  none: 'بدون بطاقة',
  bronze: 'برونز',
  silver: 'فضة',
  platinum: 'بلاتين',
}

export function digitsOnly(value) {
  return String(value || '').replace(/\D/g, '')
}

export function normalizePhoneInput(raw) {
  let digits = digitsOnly(raw)
  if (digits.startsWith('00963')) digits = digits.slice(5)
  else if (digits.startsWith('963')) digits = digits.slice(3)
  if (digits.startsWith('0')) digits = digits.slice(1)
  return digits
}

export function fmtDate(value) {
  if (!value) return '—'
  try {
    return new Intl.DateTimeFormat('ar-SY', { dateStyle: 'medium' }).format(new Date(value))
  } catch {
    return String(value).slice(0, 10)
  }
}

export function fmtPct(value) {
  if (value == null || Number.isNaN(Number(value))) return '—'
  return `${Number(value).toFixed(0)}٪`
}

export function fmtScore(score, total) {
  if (score == null) return '—'
  if (total == null) return String(score)
  return `${score} / ${total}`
}
