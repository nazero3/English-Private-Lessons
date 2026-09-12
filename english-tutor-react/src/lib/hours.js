export function currentMonthValue() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function monthBounds(ym) {
  const [year, month] = ym.split('-').map(Number)
  const last = new Date(year, month, 0).getDate()
  return {
    from: `${ym}-01`,
    to: `${ym}-${String(last).padStart(2, '0')}`,
  }
}

export function formatHours(n) {
  const value = Number(n) || 0
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

export function sessionInMonth(session, { from, to }) {
  if (session?.hours == null || session.hours === '') return false
  const d = new Date(session.session_date || session.created_at)
  if (Number.isNaN(d.getTime())) return false
  const start = new Date(`${from}T00:00:00`)
  const end = new Date(`${to}T23:59:59`)
  return d >= start && d <= end
}

export function studentHoursKey(session) {
  if (session?.student_id) return `id:${session.student_id}`
  return `name:${String(session?.student_name || '').trim().toLowerCase() || 'student'}`
}

export function groupHoursByStudent(sessions, bounds) {
  const map = new Map()
  for (const s of sessions || []) {
    if (!sessionInMonth(s, bounds)) continue
    const key = studentHoursKey(s)
    let row = map.get(key)
    if (!row) {
      row = {
        key,
        student_id: s.student_id || null,
        student_name: (s.student_name || '').trim() || 'Student',
        teacher_ids: new Set(),
        teacher_names: new Set(),
        session_count: 0,
        total_hours: 0,
      }
      map.set(key, row)
    }
    row.session_count += 1
    row.total_hours += Number(s.hours) || 0
    if (s.teacher_id) row.teacher_ids.add(s.teacher_id)
    const teacherName = s.teacher?.full_name
    if (teacherName) row.teacher_names.add(teacherName)
  }
  return [...map.values()]
    .map((row) => ({
      key: row.key,
      student_id: row.student_id,
      student_name: row.student_name,
      teacher_ids: [...row.teacher_ids],
      teacher_names: [...row.teacher_names],
      teacher_label: [...row.teacher_names].join(', ') || '—',
      session_count: row.session_count,
      total_hours: row.total_hours,
    }))
    .sort((a, b) => b.total_hours - a.total_hours || a.student_name.localeCompare(b.student_name))
}
