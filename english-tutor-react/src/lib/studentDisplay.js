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
