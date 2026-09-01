import { Link } from 'react-router-dom'
import CoursebookCard from '../components/private-lessons/CoursebookCard'
import { ENGLISH_FILE_COURSES } from '../data/englishFile'

export default function PrivateLessonsPage() {
  return (
    <div>
      <header className="teacher-dash__hero">
        <div>
          <p className="muted">
            <Link to="/teacher">← Teacher workspace</Link>
          </p>
          <h1>Private lessons</h1>
          <p className="muted">
            English File coursebooks for one-to-one sessions. Pick a level, open a File, and
            follow the lesson plan alongside the student book.
          </p>
        </div>
      </header>

      <div className="coursebook-grid">
        {ENGLISH_FILE_COURSES.map((course) => (
          <CoursebookCard key={course.id} course={course} />
        ))}
      </div>

      <section className="panel private-lessons-note">
        <h3>How to use</h3>
        <ol>
          <li>Choose Beginner (A1, 12 Files) or Intermediate (B1, 10 Files).</li>
          <li>Open the File that matches your student&apos;s current unit.</li>
          <li>Always start from lesson A, then B, then Practical English / Revise and Check.</li>
          <li>Use the PDF viewer beside the teacher summary during the session.</li>
        </ol>
      </section>
    </div>
  )
}
