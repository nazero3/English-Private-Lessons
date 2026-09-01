import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import MathLessonFlowPanel from '../components/math/MathLessonFlowPanel'
import PdfViewer from '../components/private-lessons/PdfViewer'
import CoursebookPackCards, {
  buildPackCards,
} from '../components/sheets/CoursebookPackCards'
import { getCoursebookGrade, getCoursebookUnit } from '../data/coursebookRegistry'
import { useCoursebookSubjectKey } from '../lib/coursebookRoutes'

export default function MathUnitPage() {
  const subjectKey = useCoursebookSubjectKey()
  const { gradeKey, courseId, unitNumber } = useParams()
  const grade = getCoursebookGrade(subjectKey, gradeKey)
  const unit = getCoursebookUnit(subjectKey, gradeKey, courseId, unitNumber)
  const [studentName, setStudentName] = useState('')
  const [showPdf, setShowPdf] = useState(true)

  if (!grade || !unit) {
    return (
      <div className="math-page" dir="rtl" lang="ar">
        <p className="error">الوحدة غير موجودة.</p>
        <Link className="btn secondary" to={grade?.basePath || '/teacher'}>
          العودة
        </Link>
      </div>
    )
  }

  const { course } = unit
  const basePath = `${grade.basePath}/${course.id}/unit/${unit.file}`
  const printBase = `/print/${subjectKey}/${course.id}/${unit.file}`
  const packCards = buildPackCards({
    basePath,
    printBase,
    studentName,
    titles: {
      brief: 'ملخص المعلم',
      briefDesc: 'أهداف، خطة الحصة، أخطاء شائعة، ومفتاح الإجابات.',
      worksheet: 'ورقة عمل الحصة',
      worksheetDesc: 'تمارين صفّية للطالب أثناء الحصة.',
      homework: 'واجب منزلي',
      homeworkDesc: 'تحقق مستقل للحصة القادمة.',
    },
  })

  return (
    <div className="math-page" dir="rtl" lang="ar">
      <p className="muted math-back">
        <Link to={`${grade.basePath}/${course.id}`}>→ {course.subtitle}</Link>
      </p>

      <header
        className="coursebook-header coursebook-header--compact"
        style={{ '--course-accent': course.color, '--course-soft': course.softColor }}
      >
        <div>
          <span className="coursebook-header__badge">
            {course.level} · وحدة {unit.file}
          </span>
          <h1>
            وحدة {unit.file}: {unit.title}
          </h1>
          <p className="muted">
            الكتاب من ص {unit.bookPageStart} · PDF ص {unit.pageStart}–{unit.pageEnd} ·{' '}
            {unit.topic}
          </p>
        </div>
      </header>

      <section className="panel">
        <h2 style={{ marginTop: 0 }}>حزمة أوراق للطباعة</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          مثل الإنجليزية للصفين 9 و 12: ملخص معلم، ورقة عمل، وواجب منزلي كـ PDF.
        </p>
        <CoursebookPackCards
          cards={packCards}
          studentName={studentName}
          setStudentName={setStudentName}
          labels={{
            studentLabel: 'اسم الطالب (اختياري، يُطبع على الأوراق)',
            studentPlaceholder: 'مثال: سارة',
            preview: 'معاينة',
            print: 'طباعة',
          }}
        />
      </section>

      <div className="private-session-layout">
        <aside className="private-session-sidebar">
          <MathLessonFlowPanel unit={unit} studentName={studentName} />
          <section className="panel">
            <h3>تسلسل الدرس</h3>
            <p>{unit.vocab}</p>
            <div className="math-actions">
              <a
                className="btn secondary math-btn"
                href={`${course.pdf}#page=${unit.pageStart}`}
                target="_blank"
                rel="noreferrer"
              >
                فتح الصفحات في تبويب جديد
              </a>
              <button
                type="button"
                className="btn ghost math-btn"
                onClick={() => setShowPdf((v) => !v)}
              >
                {showPdf ? 'إخفاء PDF' : 'إظهار PDF'}
              </button>
            </div>
          </section>
        </aside>

        {showPdf ? (
          <div className="private-session-viewer" dir="ltr">
            <PdfViewer
              src={course.pdf}
              page={unit.pageStart}
              title={`${course.subtitle} — وحدة ${unit.file}`}
            />
          </div>
        ) : (
          <section className="panel private-session-viewer private-session-viewer--hidden">
            <p className="muted">تم إخفاء PDF — اضغط «إظهار PDF» لإعادته.</p>
          </section>
        )}
      </div>

      <nav className="math-unit-nav no-print">
        {unit.file > 1 ? (
          <Link
            className="btn secondary math-btn"
            to={`${grade.basePath}/${course.id}/unit/${unit.file - 1}`}
          >
            الوحدة السابقة ({unit.file - 1})
          </Link>
        ) : (
          <span />
        )}
        {unit.file < course.files.length ? (
          <Link
            className="btn secondary math-btn"
            to={`${grade.basePath}/${course.id}/unit/${unit.file + 1}`}
          >
            الوحدة التالية ({unit.file + 1})
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </div>
  )
}
