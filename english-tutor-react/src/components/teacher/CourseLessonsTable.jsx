import { Link } from 'react-router-dom'

export default function CourseLessonsTable({ lessons, managerView = false }) {
  return (
    <table className="table">
      <thead>
        <tr>
          <th>Unit</th>
          <th>Theme</th>
          <th>Grammar</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {lessons.map((lesson) => (
          <tr key={lesson.id}>
            <td>{lesson.unit_number}</td>
            <td>{lesson.theme}</td>
            <td>
              {lesson.grammar}
              {lesson.arabic ? (
                <div className="muted" style={{ fontSize: '0.85rem' }}>
                  {lesson.arabic}
                </div>
              ) : null}
            </td>
            <td>
              <Link
                className="btn"
                to={`/teacher/lessons/${lesson.id}`}
                state={managerView ? { fromManager: true, courseId: lesson.course_id } : undefined}
              >
                Open pack
              </Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
