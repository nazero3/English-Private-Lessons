import { Link } from 'react-router-dom'

export default function CourseAccessCard({ course }) {
  return (
    <article className="panel course-access-card">
      <div className="course-access-card__eyebrow">Assigned course</div>
      <h3>{course.title}</h3>
      <p>
        Grade {course.grade} course. Open this course to see the lesson list and enter the
        lesson pack for any unit.
      </p>
      <div className="actions">
        <Link className="btn" to={`/teacher/courses/${course.id}`}>
          Enter course
        </Link>
      </div>
    </article>
  )
}
