import { Link, useParams, useSearchParams } from 'react-router-dom'
import { HomeworkSheet } from '../components/sheets/HomeworkSheet'
import { TeacherBrief } from '../components/sheets/TeacherBrief'
import { Worksheet } from '../components/sheets/Worksheet'
import { getEnglishFileUnit } from '../data/englishFile'
import { getCoursebookGrade, getCoursebookUnit } from '../data/coursebookRegistry'
import { useCoursebookSubjectKey } from '../lib/coursebookRoutes'
import { buildMathLessonPack, buildPrivateLessonPack } from '../lib/coursebookSheets'

function useStudentName() {
  const [params] = useSearchParams()
  return params.get('student') || ''
}

function SheetActions({ backTo, printTo, labels }) {
  const L = {
    back: '← Session',
    print: 'Print / PDF',
    printThis: 'Print this page',
    ...labels,
  }
  return (
    <div className="actions no-print" style={{ marginBottom: '1rem' }}>
      <Link className="btn secondary" to={backTo}>
        {L.back}
      </Link>
      <Link className="btn" to={printTo} target="_blank" rel="noreferrer">
        {L.print}
      </Link>
      <button type="button" className="btn secondary" onClick={() => window.print()}>
        {L.printThis}
      </button>
    </div>
  )
}

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

export function PrivateCoursebookSheetPage({ kind }) {
  const { courseId, fileNumber } = useParams()
  const studentName = useStudentName()
  const unit = getEnglishFileUnit(courseId, fileNumber)
  const lesson = unit ? buildPrivateLessonPack(unit) : null
  const backTo = `/teacher/private-lessons/${courseId}/file/${fileNumber}`
  const printTo = `/print/private/${courseId}/${fileNumber}/${kind}${
    studentName ? `?student=${encodeURIComponent(studentName)}` : ''
  }`

  if (!lesson) {
    return (
      <div>
        <p className="error">File not found.</p>
        <Link to="/teacher/private-lessons">← Private lessons</Link>
      </div>
    )
  }

  return (
    <div>
      <SheetActions backTo={backTo} printTo={printTo} />
      {renderKind(kind, lesson, studentName)}
    </div>
  )
}

export function MathCoursebookSheetPage({ kind }) {
  const subjectKey = useCoursebookSubjectKey()
  const { gradeKey, courseId, unitNumber } = useParams()
  const studentName = useStudentName()
  const grade = getCoursebookGrade(subjectKey, gradeKey)
  const unit = getCoursebookUnit(subjectKey, gradeKey, courseId, unitNumber)
  const lesson = unit ? buildMathLessonPack(unit) : null
  const backTo = `${grade?.basePath || `/teacher/${subjectKey}/grade9`}/${courseId}/unit/${unitNumber}`
  const printTo = `/print/${subjectKey}/${courseId}/${unitNumber}/${kind}${
    studentName ? `?student=${encodeURIComponent(studentName)}` : ''
  }`
  const labels = {
    back: '→ الحصة',
    print: 'طباعة / PDF',
    printThis: 'اطبع هذه الصفحة',
  }

  if (!lesson) {
    return (
      <div className="math-page" dir="rtl" lang="ar">
        <p className="error">الوحدة غير موجودة.</p>
        <Link to={grade?.basePath || `/teacher/${subjectKey}/grade9`}>العودة</Link>
      </div>
    )
  }

  return (
    <div className="math-page" dir="rtl" lang="ar">
      <SheetActions backTo={backTo} printTo={printTo} labels={labels} />
      {renderKind(kind, lesson, studentName)}
    </div>
  )
}

export function PrivateBriefPage() {
  return <PrivateCoursebookSheetPage kind="brief" />
}
export function PrivateWorksheetPage() {
  return <PrivateCoursebookSheetPage kind="worksheet" />
}
export function PrivateHomeworkPage() {
  return <PrivateCoursebookSheetPage kind="homework" />
}

export function MathBriefPage() {
  return <MathCoursebookSheetPage kind="brief" />
}
export function MathWorksheetPage() {
  return <MathCoursebookSheetPage kind="worksheet" />
}
export function MathHomeworkPage() {
  return <MathCoursebookSheetPage kind="homework" />
}
