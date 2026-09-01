import { Link, useParams } from 'react-router-dom'
import { getEnglishFileCourse } from '../data/englishFile'

export default function PrivateLessonCoursePage() {
  const { courseId } = useParams()
  const course = getEnglishFileCourse(courseId)

  if (!course) {
    return (
      <div>
        <p className="error">Coursebook not found.</p>
        <Link to="/teacher/private-lessons">← Back to private lessons</Link>
      </div>
    )
  }

  return (
    <div>
      <p className="muted">
        <Link to="/teacher/private-lessons">← Private lessons</Link>
      </p>

      <header
        className="coursebook-header"
        style={{ '--course-accent': course.color, '--course-soft': course.softColor }}
      >
        <div>
          <span className="coursebook-header__badge">{course.level} · {course.cefr}</span>
          <h1>
            {course.title} — {course.subtitle}
          </h1>
          <p>{course.description}</p>
        </div>
        <a
          className="btn"
          href={course.pdf}
          target="_blank"
          rel="noreferrer"
        >
          Open full PDF
        </a>
      </header>

      <section className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>File</th>
              <th>Lessons (start with A)</th>
              <th>Grammar</th>
              <th>Book pages</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {course.files.map((unit) => {
              const lastLesson = unit.lessons?.[unit.lessons.length - 1]
              const endBookPage =
                unit.practicalEnglish?.bookPage ||
                unit.reviseAndCheck?.bookPage ||
                lastLesson?.bookPage ||
                unit.bookPageStart
              return (
                <tr key={unit.file}>
                  <td>
                    <span className="file-badge">File {unit.file}</span>
                  </td>
                  <td>
                    <div>{unit.title}</div>
                    <div className="muted" style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
                      {(unit.lessons || []).map((l) => l.code).join(' → ')}
                      {unit.practicalEnglish ? ' → PE' : ''}
                      {unit.reviseAndCheck ? ' → R&C' : ''}
                    </div>
                  </td>
                  <td>{unit.grammar}</td>
                  <td className="muted">
                    p.{unit.bookPageStart}–{endBookPage}
                  </td>
                  <td>
                    <Link
                      className="btn secondary"
                      to={`/teacher/private-lessons/${course.id}/file/${unit.file}`}
                    >
                      Open session
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </section>
    </div>
  )
}
