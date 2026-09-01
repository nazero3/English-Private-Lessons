/** Syrian Grade 9 Math — Algebra + Geometry student books (Arabic)
 * PDF page = book page + 1 for both coursebooks.
 */

const PDF_OFFSET = 1

function pdfPage(bookPage) {
  return bookPage + PDF_OFFSET
}

const LESSON_PARTS = [
  'انطلاقة نشطة',
  'نشاط',
  'تعلّم',
  'اكتساب معارف',
  'تحقق من فهمك',
  'تدرّب',
  'تمرينات ومسائل',
  'لإحراز تقدّم',
]

function unitSummary(seriesLabel, unitTitle, lessons) {
  const first = lessons[0]
  const names = lessons.map((l) => `${l.number}) ${l.title}`).join(' · ')
  return `ابدأ الوحدة من الدرس الأول (${first.title}) في الصفحة ${first.bookPage}. دروس هذه الوحدة: ${names}. اتبع تسلسل الكتاب: انطلاقة نشطة → نشاط → تعلّم → اكتساب معارف → تحقق من فهمك → تدرّب.`
}

export const MATH_GRADE9_COURSES = [
  {
    id: 'grade9-algebra',
    subject: 'math',
    series: 'algebra',
    title: 'الرياضيات',
    subtitle: 'الجبر — الصف التاسع الأساسي',
    level: 'صف 9',
    cefr: 'الجبر',
    language: 'ar',
    dir: 'rtl',
    color: '#1a2656',
    softColor: '#e8eefc',
    pdf: '/books/math/grade-9/algebra-student-book.pdf',
    pageCount: 131,
    weeklySessions: 3,
    description:
      'كتاب الطالب لمادة الجبر للصف التاسع الأساسي (منهاج سوري). ست وحدات: أعداد، قوى، معادلات، جمل معادلات، التابع، احتمال وإحصاء.',
    files: [
      {
        file: 1,
        title: 'الأعداد والكسور',
        topic: 'طبيعة الأعداد، القواسم، الكسور، الجذر التربيعي',
        pageStart: pdfPage(12),
        bookPageStart: 12,
        summary: '',
        lessons: [
          {
            number: 1,
            title: 'طبيعة الأعداد',
            bookPage: 12,
            focus: 'الأعداد العادية والعشرية، وتمييز π والأعداد غير العادية.',
            startWith: 'ابدأ بنشاط تعيين طبيعة العدد ثم تعريفات العدد العادي والعشري.',
          },
          {
            number: 2,
            title: 'القواسم المشتركة لعددين صحيحين',
            bookPage: 15,
            focus: 'القاسم المشترك الأكبر وتطبيقاته.',
            startWith: 'راجع مفهوم القاسم ثم انتقل إلى القواسم المشتركة.',
          },
          {
            number: 3,
            title: 'كسور مختزلة',
            bookPage: 21,
            focus: 'تبسيط الكسور إلى أبسط صورة.',
            startWith: 'ابدأ بأمثلة الاختزال باستخدام القاسم المشترك الأكبر.',
          },
          {
            number: 4,
            title: 'الجذر التربيعي لعدد موجب',
            bookPage: 24,
            focus: 'تبسيط الجذور وكتابة a√b و√c وعقلنة المقام.',
            startWith: 'افتح درس الجذر التربيعي من بداية الدرس واتبع أمثلة التبسيط.',
          },
        ],
      },
      {
        file: 2,
        title: 'قوى الأعداد العادية — الحساب بالرموز',
        topic: 'القوى، النشر والتحليل، المطابقات الشهيرة',
        pageStart: pdfPage(38),
        bookPageStart: 38,
        summary: '',
        lessons: [
          {
            number: 1,
            title: 'قوة عدد عادي',
            bookPage: 38,
            focus: 'قوانين القوى للأعداد العادية.',
            startWith: 'ابدأ بتعريف القوة ثم طبّق القوانين على أمثلة الكتاب.',
          },
          {
            number: 2,
            title: 'النشر والتحليل',
            bookPage: 41,
            focus: 'نشر عبارات جبرية وتحليلها.',
            startWith: 'اعرض أمثلة النشر أولاً ثم انتقل للتحليل.',
          },
          {
            number: 3,
            title: 'مطابقات شهيرة',
            bookPage: 43,
            focus: '(a±b)² و a²−b² وتطبيقاتها.',
            startWith: 'اكتب المطابقات على السبورة ثم حل أمثلة الكتاب بالترتيب.',
          },
        ],
      },
      {
        file: 3,
        title: 'معادلات ومتراجحات',
        topic: 'معادلات ومتراجحات من الدرجة الأولى',
        pageStart: pdfPage(54),
        bookPageStart: 54,
        summary: '',
        lessons: [
          {
            number: 1,
            title: 'معادلات الدرجة الأولى بمجهول واحد',
            bookPage: 54,
            focus: 'حل معادلات خطية بمجهول واحد.',
            startWith: 'ابدأ بأمثلة المعادلة الخطية من أول الدرس.',
          },
          {
            number: 2,
            title: 'معادلات — خاصة الجداء الصفري',
            bookPage: 58,
            focus: 'خاصية الجداء الصفري وحل المعادلات الناتجة عنها.',
            startWith: 'راجع الخاصية ثم طبّقها على تمارين الكتاب.',
          },
          {
            number: 3,
            title: 'متراجحات الدرجة الأولى بمجهول واحد',
            bookPage: 62,
            focus: 'حل المتراجحات وتمثيل الحل على المستقيم.',
            startWith: 'ابدأ بتعريف المتراجحة ثم خطوات الحل.',
          },
        ],
      },
      {
        file: 4,
        title: 'جمل المعادلات',
        topic: 'جملة معادلتين، معادلة المستقيم، الحل البياني',
        pageStart: pdfPage(74),
        bookPageStart: 74,
        summary: '',
        lessons: [
          {
            number: 1,
            title: 'جملة معادلتين خطيتين بمجهولين',
            bookPage: 74,
            focus: 'حل جملة معادلتين جبرياً.',
            startWith: 'ابدأ بصياغة الجملة ثم طرق التعويض/الحذف حسب الكتاب.',
          },
          {
            number: 2,
            title: 'معادلة مستقيم',
            bookPage: 79,
            focus: 'كتابة معادلة المستقيم وفهم ميلها.',
            startWith: 'اربط المعادلة بالمستقيم من بداية الدرس.',
          },
          {
            number: 3,
            title: 'حل جملة معادلتين خطيتين بيانياً',
            bookPage: 81,
            focus: 'التمثيل البياني ونقطة التقاطع.',
            startWith: 'ارسم المستقيمين خطوة بخطوة كما في أمثلة الكتاب.',
          },
        ],
      },
      {
        file: 5,
        title: 'التابع',
        topic: 'مفهوم التابع وطرائق تعريفه',
        pageStart: pdfPage(92),
        bookPageStart: 92,
        summary: '',
        lessons: [
          {
            number: 1,
            title: 'مفهوم التابع',
            bookPage: 92,
            focus: 'تعريف التابع والمجال والمستقر.',
            startWith: 'ابدأ بأمثلة المدخلات والمخرجات ثم التعريف الرسمي.',
          },
          {
            number: 2,
            title: 'طرائق تعريف التابع',
            bookPage: 95,
            focus: 'الجدول، الصيغة، والتمثيل البياني.',
            startWith: 'اعرض طرائق التعريف بالترتيب كما في الكتاب.',
          },
        ],
      },
      {
        file: 6,
        title: 'مبادئ الاحتمال والإحصاء',
        topic: 'احتمال، أحداث، تجارب مركبة، ربيعات',
        pageStart: pdfPage(110),
        bookPageStart: 110,
        summary: '',
        lessons: [
          {
            number: 1,
            title: 'مفهوم الاحتمال',
            bookPage: 110,
            focus: 'احتمال حدث بسيط وتجارب عشوائية.',
            startWith: 'ابدأ بتجربة عشوائية بسيطة من أول الدرس.',
          },
          {
            number: 2,
            title: 'أحداث متنافية، أحداث متعاكسة',
            bookPage: 117,
            focus: 'الأحداث المتنافية والمتعاكسة.',
            startWith: 'عرّف الحدثين ثم حل أمثلة الكتاب.',
          },
          {
            number: 3,
            title: 'تجارب عشوائية مركبة',
            bookPage: 119,
            focus: 'تجارب مركبة وشجرة الاحتمالات إن وُجدت.',
            startWith: 'ابدأ بمثال تجربة مركبة من بداية الدرس.',
          },
          {
            number: 4,
            title: 'الربيعات',
            bookPage: 122,
            focus: 'المتوسط والربيعات في الإحصاء.',
            startWith: 'رتّب البيانات أولاً ثم احسب الربيعات كما في الكتاب.',
          },
        ],
      },
    ],
  },
  {
    id: 'grade9-geometry',
    subject: 'math',
    series: 'geometry',
    title: 'الرياضيات',
    subtitle: 'الهندسة — الصف التاسع الأساسي',
    level: 'صف 9',
    cefr: 'الهندسة',
    language: 'ar',
    dir: 'rtl',
    color: '#0b1024',
    softColor: '#fff1c9',
    pdf: '/books/math/grade-9/geometry-student-book.pdf',
    pageCount: 97,
    weeklySessions: 2,
    description:
      'كتاب الطالب لمادة الهندسة للصف التاسع الأساسي (منهاج سوري). أربع وحدات: نسب مثلثية، مبرهنة طالس، الدائرة والمضلعات، المجسمات والمقاطع.',
    files: [
      {
        file: 1,
        title: 'النسب المثلثية لزاوية حادة',
        topic: 'التناسب والنسب المثلثية',
        pageStart: pdfPage(12),
        bookPageStart: 12,
        summary: '',
        lessons: [
          {
            number: 1,
            title: 'بعض خواص التناسب',
            bookPage: 12,
            focus: 'خواص التناسب الأساسية.',
            startWith: 'ابدأ بخواص التناسب من أول الدرس.',
          },
          {
            number: 2,
            title: 'النسب المثلثية لزاوية حادة',
            bookPage: 15,
            focus: 'sin و cos و tan للزاوية الحادة.',
            startWith: 'عرّف النسب في المثلث القائم ثم حل أمثلة الكتاب.',
          },
          {
            number: 3,
            title: 'علاقتان مهمتان بين النسب المثلثية',
            bookPage: 19,
            focus: 'العلاقات الأساسية بين النسب المثلثية.',
            startWith: 'اكتب العلاقتين ثم طبّقهما على تمارين الكتاب.',
          },
          {
            number: 4,
            title: 'نسب زوايا شهيرة',
            bookPage: 21,
            focus: 'نسب الزوايا 30° و 45° و 60°.',
            startWith: 'احفظ/استخرج نسب الزوايا الشهيرة من جداول الكتاب.',
          },
        ],
      },
      {
        file: 2,
        title: 'مبرهنة النسب الثلاث',
        topic: 'طالس، العكسية، التشابه',
        pageStart: pdfPage(32),
        bookPageStart: 32,
        summary: '',
        lessons: [
          {
            number: 1,
            title: 'مبرهنة النسب الثلاث',
            bookPage: 32,
            focus: 'مبرهنة طالس (النسب الثلاث).',
            startWith: 'ارسم الشكل المساعد ثم اقرأ نص المبرهنة من الكتاب.',
          },
          {
            number: 2,
            title: 'مبرهنة النسب الثلاث العكسية',
            bookPage: 35,
            focus: 'المبرهنة العكسية وتطبيقاتها.',
            startWith: 'قارن المبرهنة المباشرة بالعكسية قبل التمارين.',
          },
          {
            number: 3,
            title: 'التشابه',
            bookPage: 39,
            focus: 'تشابه المثلثات والمعايير.',
            startWith: 'ابدأ بتعريف التشابه ثم معاييره في الكتاب.',
          },
        ],
      },
      {
        file: 3,
        title: 'الزوايا والمضلعات في الدائرة، المضلعات المنتظمة',
        topic: 'زوايا محيطية ومركزية، رباعي دائري، مضلعات منتظمة',
        pageStart: pdfPage(51),
        bookPageStart: 51,
        summary: '',
        lessons: [
          {
            number: 1,
            title: 'زوايا محيطية وزوايا مركزية',
            bookPage: 51,
            focus: 'العلاقة بين الزاوية المحيطية والمركزية.',
            startWith: 'عرّف الزاويتين على شكل الدائرة ثم انتقل للأمثلة.',
          },
          {
            number: 2,
            title: 'الرباعي الدائري',
            bookPage: 58,
            focus: 'خواص الرباعي الدائري.',
            startWith: 'ابدأ بتعريف الرباعي الدائري وخواصه من أول الدرس.',
          },
          {
            number: 3,
            title: 'المضلعات المنتظمة',
            bookPage: 62,
            focus: 'المضلعات المنتظمة المرتبطة بالدائرة.',
            startWith: 'راجع تعريف المضلع المنتظم ثم حل أمثلة الكتاب.',
          },
        ],
      },
      {
        file: 4,
        title: 'مجسمات ومقاطع',
        topic: 'مجسمات، الكرة، مقاطع',
        pageStart: pdfPage(74),
        bookPageStart: 74,
        summary: '',
        lessons: [
          {
            number: 1,
            title: 'تذكرة بالمجسمات',
            bookPage: 74,
            focus: 'مراجعة المجسمات الأساسية.',
            startWith: 'راجع أسماء المجسمات وخصائصها من بداية الدرس.',
          },
          {
            number: 2,
            title: 'الكرة',
            bookPage: 78,
            focus: 'الكرة وعناصرها الأساسية.',
            startWith: 'ابدأ بتعريف الكرة ثم عناصرها وأمثلتها.',
          },
          {
            number: 3,
            title: 'مقاطع مجسمات',
            bookPage: 82,
            focus: 'مقاطع المستوي للمجسمات.',
            startWith: 'اعرض أمثلة المقاطع بالترتيب كما في الكتاب.',
          },
        ],
      },
    ],
  },
]

for (const course of MATH_GRADE9_COURSES) {
  for (const unit of course.files) {
    unit.summary = unitSummary(course.subtitle, unit.title, unit.lessons)
    unit.grammar = unit.topic
    unit.vocab = LESSON_PARTS.slice(0, 4).join(' · ')
  }
}

export function getMathCourse(courseId) {
  return MATH_GRADE9_COURSES.find((c) => c.id === courseId) ?? null
}

export function getMathUnit(courseId, fileNumber) {
  const course = getMathCourse(courseId)
  if (!course) return null
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
      detail: 'اختر تمارين من «تحقق من فهمك» أو «تدرّب» يحلها الطالب على السبورة/الدفتر.',
    },
    {
      step: 'ختام وواجب',
      minutes: 5,
      detail: 'لخّص الفكرة الأساسية، وعيّن تمارين من نهاية الدرس/الوحدة كواجب منزلي.',
    },
  ]
}

export { LESSON_PARTS }
