import { Link } from 'react-router-dom'

export default function CoursebookCard({
  course,
  basePath = '/teacher/private-lessons',
  unitLabel = 'Files',
}) {
  const isRtl = course.dir === 'rtl' || course.language === 'ar'

  return (
    <Link
      className={`coursebook-card ${isRtl ? 'coursebook-card--rtl' : ''}`}
      to={`${basePath}/${course.id}`}
      style={{ '--course-accent': course.color, '--course-soft': course.softColor }}
      dir={isRtl ? 'rtl' : 'ltr'}
      lang={isRtl ? 'ar' : undefined}
    >
      <div className="coursebook-card__spine" aria-hidden />
      <div className="coursebook-card__body">
        <div className="coursebook-card__top">
          <span className="coursebook-card__level">{course.level}</span>
          <span className="coursebook-card__cefr">{course.cefr}</span>
        </div>
        <h2 className="coursebook-card__series">{course.title}</h2>
        <p className="coursebook-card__subtitle">{course.subtitle}</p>
        <p className="coursebook-card__desc">{course.description}</p>
        <div className="coursebook-card__meta">
          <span>
            {course.files.length} {unitLabel}
          </span>
          <span>{course.pageCount} {isRtl ? 'صفحة' : 'pages'}</span>
        </div>
      </div>
    </Link>
  )
}
