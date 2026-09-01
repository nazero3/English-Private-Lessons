import { useEffect } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { HomeworkSheet } from '../components/sheets/HomeworkSheet'
import { TeacherBrief } from '../components/sheets/TeacherBrief'
import { Worksheet } from '../components/sheets/Worksheet'
import { getEnglishFileUnit } from '../data/englishFile'
import { getCoursebookCourseById, getCoursebookUnitByCourseId } from '../data/coursebookRegistry'
import { buildMathLessonPack, buildPrivateLessonPack } from '../lib/coursebookSheets'

function renderKind(kind, lesson, studentName) {
  if (kind === 'brief') {
    return <TeacherBrief lesson={lesson} course={lesson.course} studentName={studentName} />
  }
  if (kind === 'worksheet') {
    return <Worksheet lesson={lesson} course={lesson.course} studentName={studentName} />
  }
  if (kind === 'homework') {
    return <HomeworkSheet lesson={lesson} course={lesson.course} studentName={studentName} />
  }
  return <p className="error">Unknown sheet type.</p>
}

export default function CoursebookPrintPage({ source }) {
  const { courseId, fileNumber, unitNumber, kind } = useParams()
  const [params] = useSearchParams()
  const studentName = params.get('student') || ''
  const isPrivate = source === 'private'
  const ref = isPrivate ? fileNumber : unitNumber
  const unit = isPrivate
    ? getEnglishFileUnit(courseId, ref)
    : getCoursebookUnitByCourseId(courseId, ref)
  const lesson = unit
    ? isPrivate
      ? buildPrivateLessonPack(unit)
      : buildMathLessonPack(unit)
    : null
  const found = isPrivate ? null : getCoursebookCourseById(courseId)
  const backTo = isPrivate
    ? `/teacher/private-lessons/${courseId}/file/${ref}`
    : `${found?.grade.basePath || '/teacher'}/${courseId}/unit/${ref}`

  useEffect(() => {
    if (!lesson) return
    const t = setTimeout(() => window.print(), 400)
    return () => clearTimeout(t)
  }, [lesson, kind])

  if (!lesson) {
    return (
      <div className={isPrivate ? undefined : 'math-page'} dir={isPrivate ? undefined : 'rtl'}>
        <p className="error">{isPrivate ? 'File not found.' : 'الوحدة غير موجودة.'}</p>
        <Link to={isPrivate ? '/teacher/private-lessons' : found?.grade.basePath || '/teacher'}>
          {isPrivate ? '← Back' : 'العودة'}
        </Link>
      </div>
    )
  }

  return (
    <div
      className={`print-root app-shell${isPrivate ? '' : ' math-page'}`}
      dir={isPrivate ? undefined : 'rtl'}
      lang={isPrivate ? undefined : 'ar'}
    >
      <div className="actions no-print" style={{ marginBottom: '1rem' }}>
        <button type="button" className="btn" onClick={() => window.print()}>
          {isPrivate ? 'Print / Save PDF' : 'طباعة / حفظ PDF'}
        </button>
        <Link className="btn secondary" to={backTo}>
          {isPrivate ? 'Back to session' : 'العودة للحصة'}
        </Link>
        <span className="muted" style={{ alignSelf: 'center', fontSize: '0.85rem' }}>
          {isPrivate
            ? 'Tip: use Chrome → Save as PDF · A4 · margins Default'
            : 'نصيحة: Chrome ← حفظ كـ PDF · A4'}
        </span>
      </div>
      {renderKind(kind, lesson, studentName)}
    </div>
  )
}
