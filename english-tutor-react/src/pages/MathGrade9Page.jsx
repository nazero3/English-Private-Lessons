import { Link } from 'react-router-dom'
import CoursebookCard from '../components/private-lessons/CoursebookCard'
import { MATH_GRADE9_COURSES } from '../data/mathGrade9'

export default function MathGrade9Page() {
  return (
    <div className="math-page" dir="rtl" lang="ar">
      <header className="teacher-dash__hero">
        <div>
          <p className="muted">
            <Link to="/teacher">→ مساحة المعلم</Link>
          </p>
          <h1>رياضيات الصف التاسع</h1>
          <p className="muted">
            كتابا الطالب للمنهاج السوري: الجبر والهندسة. اختر السلسلة ثم افتح الوحدة.
          </p>
        </div>
      </header>

      <div className="coursebook-grid">
        {MATH_GRADE9_COURSES.map((course) => (
          <CoursebookCard
            key={course.id}
            course={course}
            basePath="/teacher/math-grade9"
            unitLabel="وحدات"
          />
        ))}
      </div>

      <section className="panel math-howto">
        <h3>طريقة الاستخدام</h3>
        <ol>
          <li>اختر الجبر (6 وحدات) أو الهندسة (4 وحدات).</li>
          <li>افتح الوحدة المناسبة لمستوى الطالب الحالي.</li>
          <li>ابدأ دائماً من الدرس الأول في الوحدة ثم أكمل بالترتيب.</li>
          <li>استخدم عارض PDF بجانب ملخص المعلم أثناء الحصة.</li>
        </ol>
      </section>
    </div>
  )
}
