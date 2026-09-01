import { PRIVATE_ENGLISH_EXERCISES } from '../data/privateEnglishExercises'
import { MATH_GRADE9_EXERCISES } from '../data/mathGrade9Exercises'
import { MATH_GRADE12_EXERCISES } from '../data/mathGrade12Exercises'
import { PHYSICS_GRADE12_EXERCISES } from '../data/physicsGrade12Exercises'
import { getPrivateLessonFlow } from '../data/englishFile'
import { getCoursebookLessonFlow } from '../data/coursebookRegistry'

const MATH_EXERCISES = {
  ...MATH_GRADE9_EXERCISES,
  ...MATH_GRADE12_EXERCISES,
  ...PHYSICS_GRADE12_EXERCISES,
}

function toWorksheet(exercises, writePrompt) {
  const items = (exercises || []).map((ex, i) => ({
    id: `ws-${i + 1}`,
    type: 'fill',
    prompt: ex.q,
    answer: ex.a,
  }))
  items.push({
    id: 'ws-prod',
    type: 'write',
    prompt: writePrompt,
    answer: '',
  })
  return items
}

function toHomework(exercises, grammar, prompts) {
  const base = (exercises || []).map((ex, i) => ({
    id: `hw-${i + 1}`,
    type: 'fill',
    prompt: String(ex.q).replace(/____/g, '__________'),
    answer: ex.a,
  }))
  base.push({
    id: 'hw-reflect',
    type: 'write',
    prompt: prompts.reflect(grammar),
    answer: '',
  })
  base.push({
    id: 'hw-prod',
    type: 'write',
    prompt: prompts.produce,
    answer: '',
  })
  return base
}

const EN_COPY = {
  locale: 'en',
  dir: 'ltr',
  unitLabel: 'File',
  briefTitle: 'Teacher Lesson Brief',
  worksheetTitle: 'In-lesson Worksheet',
  homeworkTitle: 'Homework',
  warmupTitle: 'Warm-up',
  practiceTitle: 'Practice',
  writeTitle: 'Write',
  objectivesTitle: 'Learning objectives',
  grammarTitle: 'Grammar focus',
  visualTitle: 'Visual contrast',
  flowTitle: 'Session flow (≈60 min)',
  mistakesTitle: 'Common L1 mistakes',
  notesTitle: 'Teacher notes',
  answerKeyTitle: 'Teacher answer key',
  worksheetKeyTitle: 'Worksheet',
  homeworkKeyTitle: 'Homework',
  studentLabel: 'Student',
  dateLabel: 'Date',
  dueLabel: 'Due: next session',
  homeworkIntro: 'Complete independently. Bring this sheet to your next private lesson.',
  signature: 'Parent / self-check: I completed this homework. ________________',
  warmup: 'Tell your teacher one sentence about your week. Then listen for today’s language focus.',
  writePrompt: 'Write 2–3 original sentences using today’s grammar and vocabulary.',
  homeworkPrompts: {
    reflect: (grammar) => `Explain in one sentence when we use: ${grammar}.`,
    produce: 'Write a short paragraph (4–5 sentences) using today’s grammar and vocabulary.',
  },
}

const AR_COPY = {
  locale: 'ar',
  dir: 'rtl',
  unitLabel: 'وحدة',
  briefTitle: 'ملخص المعلم',
  worksheetTitle: 'ورقة عمل الحصة',
  homeworkTitle: 'واجب منزلي',
  warmupTitle: 'تهيئة',
  practiceTitle: 'تدرّب',
  writeTitle: 'اكتب',
  objectivesTitle: 'أهداف التعلّم',
  grammarTitle: 'موضوع الوحدة',
  visualTitle: 'تذكير بصري',
  flowTitle: 'خطة الحصة (≈60 دقيقة)',
  mistakesTitle: 'أخطاء شائعة وانتباه المعلم',
  notesTitle: 'ملاحظات المعلم',
  answerKeyTitle: 'مفتاح الإجابات (للمعلم)',
  worksheetKeyTitle: 'ورقة العمل',
  homeworkKeyTitle: 'الواجب',
  studentLabel: 'الطالب',
  dateLabel: 'التاريخ',
  dueLabel: 'التسليم: الحصة القادمة',
  homeworkIntro: 'أكمِل بشكل مستقل. أحضِر هذه الورقة إلى الحصة القادمة.',
  signature: 'توقيع ولي الأمر / التأكد الذاتي: أنجزت الواجب. ________________',
  warmup: 'راجع مع المعلم فكرة واحدة من الدرس السابق، ثم افتح صفحة بداية الوحدة.',
  writePrompt: 'اكتب خطوات حل مسألتين من أفكار هذه الوحدة (دون نسخ الحل النهائي فقط).',
  homeworkPrompts: {
    reflect: (topic) => `اشرح بجملة واحدة الفكرة الأساسية لـ: ${topic}.`,
    produce: 'حل مسألتين إضافيتين من نهاية الدرس/الوحدة، واكتب الحل بخطوات واضحة.',
  },
}

function buildFromBank({
  unit,
  course,
  bankEntry,
  flow,
  copy,
  focusLabel,
  pageNote,
}) {
  const exercises = bankEntry?.exercises || []
  const grammar = unit.grammar || unit.topic || focusLabel
  const theme = unit.title

  return {
    id: `${course.id}-file-${unit.file}`,
    unit_number: unit.file,
    unit_label: copy.unitLabel,
    theme,
    grammar,
    arabic: '',
    explanation: bankEntry?.explanation || unit.summary || '',
    visual: bankEntry?.visual || [],
    objectives:
      copy.locale === 'ar'
        ? [
            `فهم موضوع الوحدة: ${theme}.`,
            `التدرّب على أفكار الدروس بالترتيب من ص ${unit.bookPageStart}.`,
            'حل تمارين صفّية وواجب منزلي بخطوات واضحة.',
          ]
        : [
            `Cover File ${unit.file} language: ${grammar}.`,
            `Work lessons in book order from p.${unit.bookPageStart}.`,
            'Complete controlled practice and personalised production.',
          ],
    session_flow: flow.map((step) => ({
      minutes: step.minutes,
      step: step.step,
      detail: step.detail,
    })),
    common_mistakes: bankEntry?.mistakes || [],
    teacher_notes: pageNote,
    worksheet: toWorksheet(exercises, copy.writePrompt),
    homework: toHomework(exercises, grammar, copy.homeworkPrompts),
    copy,
    dir: copy.dir,
    lang: copy.locale,
    course: {
      id: course.id,
      title: course.title,
      subtitle: course.subtitle,
      grade: course.level,
    },
  }
}

export function buildPrivateLessonPack(unit) {
  if (!unit?.course) return null
  const bank =
    PRIVATE_ENGLISH_EXERCISES[unit.course.id]?.[unit.file] || {
      explanation: unit.summary,
      visual: (unit.lessons || []).slice(0, 2).map((l) => [l.code, l.grammar]),
      exercises: [
        { q: `Write one example sentence using: ${unit.grammar}.`, a: '(open response)' },
        { q: `List 4 vocabulary items from: ${unit.vocab}.`, a: '(open response)' },
      ],
      mistakes: [
        {
          wrong: 'Skipping lesson A and jumping ahead.',
          tip: 'Always start each File at lesson A, then B.',
        },
      ],
    }

  return buildFromBank({
    unit,
    course: unit.course,
    bankEntry: bank,
    flow: getPrivateLessonFlow(unit),
    copy: EN_COPY,
    focusLabel: unit.grammar,
    pageNote: `${unit.summary} Book from p.${unit.bookPageStart}. Prefer Workbook pages for this File as follow-up homework if the sheet is finished.`,
  })
}

export function buildMathLessonPack(unit) {
  if (!unit?.course) return null
  const bank =
    MATH_EXERCISES[unit.course.id]?.[unit.file] || {
      explanation: unit.summary,
      visual: (unit.lessons || []).slice(0, 2).map((l) => [`درس ${l.number}`, l.focus]),
      exercises: [
        { q: `اكتب تعريفًا قصيرًا لموضوع: ${unit.topic}.`, a: '(إجابة مفتوحة)' },
        { q: 'اختر تمرينين من «تدرّب» وحلهما بخطوات.', a: '(إجابة مفتوحة)' },
      ],
      mistakes: [
        {
          wrong: 'الانتقال لتمارين دون قراءة أمثلة التعلّم.',
          tip: 'التزم تسلسل الكتاب: انطلاقة → نشاط → تعلّم → تدرّب.',
        },
      ],
    }

  return buildFromBank({
    unit,
    course: unit.course,
    bankEntry: bank,
    flow: getCoursebookLessonFlow(unit),
    copy: AR_COPY,
    focusLabel: unit.topic,
    pageNote: `${unit.summary} عيّن تمارين من نهاية الدرس كواجب، وراجع الأخطاء الشائعة في الحصة التالية.`,
  })
}
