export function fmtPct(value) {
  return value == null ? '—' : `${value}%`
}

export function fmtScore(score, total) {
  if (score == null) return '—'
  if (total == null) return String(score)
  return `${score}/${total}`
}

export function fmtDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString()
}

export function todayInputValue() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function toDateInput(value) {
  if (!value) return todayInputValue()
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return todayInputValue()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function clipText(text, max = 140) {
  const t = String(text || '').replace(/\s+/g, ' ').trim()
  if (!t) return ''
  return t.length > max ? `${t.slice(0, max - 1).trim()}…` : t
}

export function sessionCourseName(s) {
  return s?.course?.title || s?.course_title || 'Course'
}

export function sessionLessonName(s) {
  const number = s?.lesson?.unit_number ?? s?.unit_number
  const theme = (s?.lesson?.theme || s?.unit_label || '').trim()
  if (number != null && theme && theme !== 'Lesson') return `Unit ${number} · ${theme}`
  if (number != null) return `Unit ${number}`
  return theme || 'Lesson'
}

export function latestSessionForStudent(sessions, student) {
  const id = student?.id
  const name = String(student?.full_name || '').trim().toLowerCase()
  return (
    (sessions || [])
      .filter((s) => {
        if (id && s.student_id === id) return true
        if (s.student_id && s.student_id !== id) return false
        return String(s.student_name || '').trim().toLowerCase() === name
      })
      .sort(
        (a, b) =>
          new Date(b.session_date || b.created_at) - new Date(a.session_date || a.created_at),
      )[0] || null
  )
}
