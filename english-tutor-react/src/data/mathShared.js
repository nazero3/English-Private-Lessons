/** Shared helpers for Syrian math coursebooks (Grade 9, 12, …). */

export const PDF_OFFSET = 1

export function pdfPage(bookPage) {
  return bookPage + PDF_OFFSET
}

export const LESSON_PARTS = [
  'انطلاقة نشطة',
  'نشاط',
  'تعلّم',
  'اكتساب معارف',
  'تحقق من فهمك',
  'تدرّب',
  'تمرينات ومسائل',
  'لإحراز تقدّم',
]

export function unitSummary(_seriesLabel, _unitTitle, lessons) {
  const first = lessons[0]
  const names = lessons.map((l) => `${l.number}) ${l.title}`).join(' · ')
  return `ابدأ الوحدة من الدرس الأول (${first.title}) في الصفحة ${first.bookPage}. دروس هذه الوحدة: ${names}. اتبع تسلسل الكتاب: انطلاقة نشطة → نشاط → تعلّم → اكتساب معارف → تحقق من فهمك → تدرّب.`
}

export function finalizeMathCourse(course) {
  for (const unit of course.files) {
    unit.summary = unitSummary(course.subtitle, unit.title, unit.lessons)
    unit.grammar = unit.topic
    unit.vocab = LESSON_PARTS.slice(0, 4).join(' · ')
  }
  return course
}

export function resolveMathUnit(course, fileNumber) {
  const num = Number(fileNumber)
  const unit = course.files.find((f) => f.file === num)
  if (!unit) return null
  const next = course.files.find((f) => f.file === num + 1)
  return {
    ...unit,
    course,
    pageEnd: next ? next.pageStart - 1 : course.pageCount,
  }
}

export function getMathLessonFlow(unit) {
  const first = unit.lessons?.[0]
  const last = unit.lessons?.[unit.lessons.length - 1]
  return [
    {
      step: 'تهيئة',
      minutes: 5,
      detail: first
        ? `مراجعة سريعة قبل فتح الوحدة: ${unit.title}.`
        : 'مراجعة قصيرة مرتبطة بموضوع الوحدة.',
    },
    {
      step: `بدء الدرس 1 من ص ${first?.bookPage || unit.bookPageStart}`,
      minutes: 20,
      detail: first
        ? `${first.startWith} التركيز: ${first.focus}`
        : 'ابدأ من أول درس في الوحدة حسب ترتيب الكتاب.',
    },
    {
      step: 'متابعة دروس الوحدة',
      minutes: 20,
      detail: last
        ? `أكمل الدروس بالترتيب حتى «${last.title}» مع تمارين تحقق من فهمك وتدرّب.`
        : 'أكمل دروس الوحدة وفق ترتيب الكتاب.',
    },
    {
      step: 'تطبيق صفّي',
      minutes: 10,
      detail: 'اختر تمارين من قسم تحقق من فهمك أو تدرّب يحلها الطالب على السبورة/الدفتر.',
    },
    {
      step: 'ختام وواجب',
      minutes: 5,
      detail: 'لخّص الفكرة الأساسية، وعيّن تمارين من نهاية الدرس/الوحدة كواجب منزلي.',
    },
  ]
}
