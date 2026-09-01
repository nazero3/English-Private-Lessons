import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import CourseLessonsTable from '../components/teacher/CourseLessonsTable'
import { useAuth } from '../lib/AuthContext'
import { api } from '../lib/api'

export default function ManagerCoursePage() {
  const { courseId } = useParams()
  const { profile } = useAuth()
  const [course, setCourse] = useState(null)
  const [lessons, setLessons] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const list = await api.listLessons(courseId)
        setLessons(list)
        if (list[0]) {
          const full = await api.getLesson(list[0].id)
          setCourse(full.course || null)
        } else {
          const courses = await api.listCourses(profile)
          setCourse(courses.find((c) => c.id === courseId) || null)
        }
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [courseId, profile])

  return (
    <div>
      <p className="muted">
        <Link to="/manager">← Manager</Link>
      </p>

      {loading ? <p className="muted">Loading course…</p> : null}
      {error ? <p className="error">{error}</p> : null}

      {!loading && course ? (
        <>
          <section className="panel course-header-card">
            <div className="course-header-card__meta">
              <span className="badge">Grade {course.grade}</span>
            </div>
            <h1>{course.title}</h1>
            <p className="muted">
              Same lesson packs teachers see: preview briefs, worksheets, quizzes, and homework —
              print or open check mode.
            </p>
          </section>

          <section className="panel">
            <h2>Lesson units</h2>
            {!lessons.length ? (
              <p className="muted">No lessons found for this course yet.</p>
            ) : (
              <CourseLessonsTable lessons={lessons} managerView />
            )}
          </section>
        </>
      ) : null}
    </div>
  )
}
