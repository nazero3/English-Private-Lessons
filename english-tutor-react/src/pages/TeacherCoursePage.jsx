import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import CourseLessonsTable from '../components/teacher/CourseLessonsTable'
import { useAuth } from '../lib/AuthContext'
import { api } from '../lib/api'

export default function TeacherCoursePage() {
  const { courseId } = useParams()
  const { profile } = useAuth()
  const [course, setCourse] = useState(null)
  const [lessons, setLessons] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [notAssigned, setNotAssigned] = useState(false)

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      setError('')
      setNotAssigned(false)
      try {
        const courses = await api.listCourses(profile)
        const selectedCourse = courses.find((item) => item.id === courseId)
        if (!selectedCourse) {
          setNotAssigned(true)
          setCourse(null)
          setLessons([])
          return
        }

        setCourse(selectedCourse)
        setLessons(await api.listLessons(courseId))
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [courseId, profile])

  if (notAssigned) {
    return <Navigate to="/teacher" replace />
  }

  return (
    <div>
      <p className="muted">
        <Link to="/teacher">← My courses</Link>
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
              These are the lesson packs available in this assigned course. Open any unit to
              print sheets or check answers on screen.
            </p>
          </section>

          <section className="panel">
            <h2>Lesson units</h2>
            {!lessons.length ? (
              <p className="muted">No lessons found for this course yet.</p>
            ) : (
              <CourseLessonsTable lessons={lessons} />
            )}
          </section>
        </>
      ) : null}
    </div>
  )
}
