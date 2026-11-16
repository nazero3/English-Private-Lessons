import { PERFORMANCE_NOTE_PRESETS } from '../lib/lessonNotePresets'

/** Teacher preset chips, shown to parents in Arabic. Unknown chips stay as written. */
const TAG_AR = {
  'Excellent participation': 'مشاركة ممتازة',
  'Good progress': 'تقدم جيد',
  'Needs more practice': 'يحتاج مزيداً من التمرين',
  'Low focus today': 'تركيز أقل اليوم',
  'Confident with material': 'مرتاح مع الدرس',
  'Struggled with material': 'واجه صعوبة',
  Grammar: 'قواعد',
  Vocabulary: 'مفردات',
  Reading: 'قراءة',
  Writing: 'كتابة',
  Listening: 'استماع',
  Speaking: 'محادثة',
  'Homework review': 'مراجعة الواجب',
  'Exam practice': 'تدريب امتحان',
  'Unit review': 'مراجعة الوحدة',
}

const PERFORMANCE = new Set(PERFORMANCE_NOTE_PRESETS)

export function tagLabel(tag) {
  const text = String(tag || '').trim()
  return TAG_AR[text] || text
}

export function isPerformanceTag(tag) {
  return PERFORMANCE.has(String(tag || '').trim())
}

export function courseKey(course) {
  const title = String(course?.title || '').trim()
  return String(course?.id || title || '__other__')
}

export function courseTitle(course) {
  const title = String(course?.title || '').trim()
  return title || 'حصص أخرى'
}

export function lessonTitle(session) {
  const theme = String(session?.lesson?.theme || '').trim()
  if (!theme || theme === 'Lesson') return 'حصة'
  return theme
}

const NAME_TITLES = new Set(['أم', 'ابو', 'أبو', 'والد', 'والدة'])

export function firstName(value) {
  const name = String(value || '').trim()
  if (!name) return ''
  const [first] = name.split(/\s+/)
  if (NAME_TITLES.has(first)) return name
  return first
}
