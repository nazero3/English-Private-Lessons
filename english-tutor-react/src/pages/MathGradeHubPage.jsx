import { Link, useParams } from 'react-router-dom'
import CoursebookCard from '../components/private-lessons/CoursebookCard'
import { getCoursebookGrade } from '../data/coursebookRegistry'
import { useCoursebookSubjectKey } from '../lib/coursebookRoutes'

export default function MathGradeHubPage() {
  const subjectKey = useCoursebookSubjectKey()
  const { gradeKey } = useParams()
  const grade = getCoursebookGrade(subjectKey, gradeKey)

  if (!grade) {
    return (
      <div className="math-page" dir="rtl" lang="ar">
        <p className="error">الصف غير موجود.</p>
        <Link className="btn secondary" to="/teacher">
          العودة لمساحة المعلم
        </Link>
      </div>
    )
  }

  return (
    <div className="math-page" dir="rtl" lang="ar">
      <header className="teacher-dash__hero">
        <div>
          <p className="muted">
            <Link to="/teacher">→ مساحة المعلم</Link>
          </p>
          <h1>{grade.title}</h1>
          <p className="muted">{grade.subtitle}</p>
        </div>
      </header>

      <div className="coursebook-grid">
        {grade.courses.map((course) => (
          <CoursebookCard
            key={course.id}
            course={course}
            basePath={grade.basePath}
            unitLabel="وحدات"
          />
        ))}
      </div>

      <section className="panel math-howto">
        <h3>طريقة الاستخدام</h3>
        <ol>
          <li>اختر الكتاب (جزء 1 أو جزء 2 للبكالوريا، أو الجبر/الهندسة للصف التاسع).</li>
          <li>افتح الوحدة المناسبة لمستوى الطالب الحالي.</li>
          <li>ابدأ من الدرس الأول في الوحدة ثم أكمل بالترتيب.</li>
          <li>اطبع ملخص المعلم، ورقة العمل، والواجب من حزمة الأوراق.</li>
        </ol>
      </section>
    </div>
  )
}
