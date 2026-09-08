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

export const COPY = {
  headline: 'منصة كينز.. شركاء في رحلة نجاح أبنائكم.',
  subhead: 'نلهمهم اليوم، لإيماننا بأنهم أمل الغد.',
  welcome: 'شكراً لاختياركم كينز.. بكم يكتمل نجاحنا.',
  motto: 'المعرفة هي الكنز الحقيقي',
  outcome: 'تابع آخر حصة لابنك من هاتفك — الملاحظات والواجب في مكان واحد.',
}

export const HOW_IT_WORKS = [
  { n: '01', title: 'تُحفظ الحصة', text: 'المعلّم يسجّل الملاحظات والواجب بعد اللقاء.' },
  { n: '02', title: 'تراها فوراً', text: 'تفتح المنصة وتعرف ماذا حصل، بلا سؤال عبر واتساب.' },
  { n: '03', title: 'تُكافأ المتابعة', text: 'الحضور والواجبات وأنشطة المركز تتحول إلى نقاط وبطاقة.' },
]

export const TIER_STORY = [
  { tier: 'bronze', title: 'برونزية', hint: 'فئة البداية والترحيب', points: 100, discount: '5٪' },
  { tier: 'silver', title: 'فضية', hint: 'بعد تجميع حد معيّن من النقاط', points: 400, discount: '10٪' },
  { tier: 'platinum', title: 'بلاتين', hint: 'الفئة الأعلى — أعلى المزايا والخصومات', points: 1000, discount: '15٪' },
]

export const POINT_SOURCES = [
  { id: 'attendance', title: 'المواظبة والحضور', text: 'تُمنح عند التزام الطالب بالحضور في موعده.' },
  { id: 'homework', title: 'تسليم الواجبات', text: 'نقاط تشجيعية عند تصحيح الواجب في موعده.' },
  { id: 'exams', title: 'التفوق في الاختبارات', text: 'مكافآت إضافية عند الدرجات الممتازة — يضيفها المركز.' },
  { id: 'activity', title: 'أنشطة المركز', text: 'يوم الأهل، المسابقات والورش — الحضور يمنح نقاطاً يضيفها المركز.' },
  { id: 'checkin', title: 'متابعة الأهل', text: 'زيارة أسبوعية للتطبيق تُحسب كشراكة فاعلة.' },
  { id: 'referral', title: 'أصدقاء كينز', text: 'كود إحالة خاص بكم. تُضاف المكافأة عند تسجيل طالب جديد عبره.' },
  { id: 'renewal', title: 'تجديد الاشتراك', text: 'نقاط تُضاف إلى المحفظة مع كل تجديد — يتابعها المركز.' },
]

export const WELCOME_KEY = 'kinz_welcome_seen'

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
