import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import LessonFlowPanel from '../components/private-lessons/LessonFlowPanel'
import PdfViewer from '../components/private-lessons/PdfViewer'
import CoursebookPackCards, {
  buildPackCards,
} from '../components/sheets/CoursebookPackCards'
import { getEnglishFileUnit } from '../data/englishFile'

export default function PrivateLessonFilePage() {
  const { courseId, fileNumber } = useParams()
  const unit = getEnglishFileUnit(courseId, fileNumber)
  const [studentName, setStudentName] = useState('')
  const [showPdf, setShowPdf] = useState(true)

  if (!unit) {
    return (
      <div>
        <p className="error">File not found.</p>
        <Link to="/teacher/private-lessons">← Back to private lessons</Link>
      </div>
    )
  }

  const { course } = unit
  const basePath = `/teacher/private-lessons/${course.id}/file/${unit.file}`
  const printBase = `/print/private/${course.id}/${unit.file}`
  const packCards = buildPackCards({ basePath, printBase, studentName })

  return (
    <div>
      <p className="muted">
        <Link to={`/teacher/private-lessons/${course.id}`}>
          ← {course.subtitle}
        </Link>
      </p>

      <header
        className="coursebook-header coursebook-header--compact"
        style={{ '--course-accent': course.color, '--course-soft': course.softColor }}
      >
        <div>
          <span className="coursebook-header__badge">
            {course.level} · File {unit.file}
          </span>
          <h1>
            File {unit.file}: {unit.title}
          </h1>
          <p className="muted">
            Book from p.{unit.bookPageStart} · PDF p.{unit.pageStart}–{unit.pageEnd} ·{' '}
            {unit.grammar}
          </p>
        </div>
      </header>

      <section className="panel">
        <h2 style={{ marginTop: 0 }}>Printable lesson pack</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Same sheet types as Grade 9 / 12: teacher brief, in-lesson worksheet, and homework PDF.
        </p>
        <CoursebookPackCards
          cards={packCards}
          studentName={studentName}
          setStudentName={setStudentName}
        />
      </section>

      <div className="private-session-layout">
        <aside className="private-session-sidebar">
          <LessonFlowPanel unit={unit} studentName={studentName} />
          <section className="panel">
            <h3>Vocabulary preview</h3>
            <p>{unit.vocab}</p>
            <div className="actions" style={{ marginTop: '0.75rem' }}>
              <a
                className="btn secondary"
                href={`${course.pdf}#page=${unit.pageStart}`}
                target="_blank"
                rel="noreferrer"
              >
                Open pages in new tab
              </a>
              <button
                type="button"
                className="btn ghost"
                onClick={() => setShowPdf((v) => !v)}
              >
                {showPdf ? 'Hide PDF' : 'Show PDF'}
              </button>
            </div>
          </section>
        </aside>

        {showPdf ? (
          <div className="private-session-viewer">
            <PdfViewer
              src={course.pdf}
              page={unit.pageStart}
              title={`${course.title} ${course.subtitle} — File ${unit.file}`}
            />
          </div>
        ) : (
          <section className="panel private-session-viewer private-session-viewer--hidden">
            <p className="muted">PDF hidden — click &ldquo;Show PDF&rdquo; to bring it back.</p>
          </section>
        )}
      </div>

      <nav className="file-nav no-print">
        {unit.file > 1 ? (
          <Link
            className="btn secondary"
            to={`/teacher/private-lessons/${course.id}/file/${unit.file - 1}`}
          >
            ← File {unit.file - 1}
          </Link>
        ) : (
          <span />
        )}
        {unit.file < course.files.length ? (
          <Link
            className="btn secondary"
            to={`/teacher/private-lessons/${course.id}/file/${unit.file + 1}`}
          >
            File {unit.file + 1} →
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </div>
  )
}
