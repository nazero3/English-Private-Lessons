import { Link } from 'react-router-dom'

export default function CoursebookPackCards({ cards, studentName, setStudentName, labels }) {
  const L = {
    studentLabel: 'Student name (optional, prints on sheets)',
    studentPlaceholder: 'e.g. Sara',
    preview: 'Preview',
    print: 'Print',
    ...labels,
  }

  return (
    <div className="coursebook-pack">
      <div className="field" style={{ maxWidth: 360 }}>
        <label htmlFor="pack-student">{L.studentLabel}</label>
        <input
          id="pack-student"
          value={studentName}
          onChange={(e) => setStudentName(e.target.value)}
          placeholder={L.studentPlaceholder}
        />
      </div>

      <div className="grid-2 pack-grid">
        {cards.map((card) => (
          <div className="panel pack-card" key={card.title}>
            <h3>{card.title}</h3>
            <p>{card.desc}</p>
            <div className="actions">
              <Link className="btn secondary" to={card.view}>
                {L.preview}
              </Link>
              <Link className="btn" to={card.print} target="_blank" rel="noreferrer">
                {L.print}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function buildPackCards({ basePath, printBase, studentName, titles }) {
  const q = studentName ? `?student=${encodeURIComponent(studentName)}` : ''
  const T = titles || {}
  return [
    {
      title: T.brief || 'Teacher Brief',
      desc: T.briefDesc || 'Prep summary: objectives, flow, tips, answer keys.',
      view: `${basePath}/brief${q}`,
      print: `${printBase}/brief${q}`,
    },
    {
      title: T.worksheet || 'In-lesson Worksheet',
      desc: T.worksheetDesc || 'Student practice sheet for the session.',
      view: `${basePath}/worksheet${q}`,
      print: `${printBase}/worksheet${q}`,
    },
    {
      title: T.homework || 'Homework',
      desc: T.homeworkDesc || 'Independent check for next session.',
      view: `${basePath}/homework${q}`,
      print: `${printBase}/homework${q}`,
    },
  ]
}
