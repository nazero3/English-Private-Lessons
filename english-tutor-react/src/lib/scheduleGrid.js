export const WEEKDAYS = [
  { id: 0, en: 'Saturday', ar: 'السبت' },
  { id: 1, en: 'Sunday', ar: 'الأحد' },
  { id: 2, en: 'Monday', ar: 'الاثنين' },
  { id: 3, en: 'Tuesday', ar: 'الثلاثاء' },
  { id: 4, en: 'Wednesday', ar: 'الأربعاء' },
  { id: 5, en: 'Thursday', ar: 'الخميس' },
]

export const GRID_START_MINUTES = 12 * 60
export const GRID_END_MINUTES = 22 * 60
export const SLOT_STEP_MINUTES = 30
export const DEFAULT_DURATION_MINUTES = 60
export const ALLOWED_DURATIONS = [30, 60, 90]

export const STUDENT_COLORS = [
  '#F5E6C8',
  '#F8D0D0',
  '#C5D8F0',
  '#F5CBA7',
  '#D4E8D0',
  '#E4D5F0',
  '#FFE6A7',
  '#D0E8E3',
]

export function timeStarts(fromApi) {
  if (Array.isArray(fromApi) && fromApi.length) return fromApi
  const starts = []
  for (let minute = GRID_START_MINUTES; minute <= GRID_END_MINUTES; minute += SLOT_STEP_MINUTES) {
    starts.push(minute)
  }
  return starts
}

export function formatClock(minutes) {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  const display = hours > 12 ? hours - 12 : hours
  return `${display}:${String(mins).padStart(2, '0')}`
}

export function occupiedStarts(startMinutes, durationMinutes) {
  const ticks = durationMinutes / SLOT_STEP_MINUTES
  return Array.from({ length: ticks }, (_, i) => startMinutes + i * SLOT_STEP_MINUTES)
}

export function slotAt(slots, weekday, startMinutes) {
  return (slots || []).find((slot) => {
    if (slot.weekday !== weekday) return false
    return occupiedStarts(slot.start_minutes, slot.duration_minutes).includes(startMinutes)
  })
}

export function colorForStudent(slots, studentId) {
  const existing = (slots || []).find((slot) => slot.student_id === studentId)
  if (existing?.color) return existing.color
  const used = new Set((slots || []).map((slot) => slot.color))
  return STUDENT_COLORS.find((color) => !used.has(color)) || STUDENT_COLORS[0]
}

export function weeklyHours(slots) {
  const total = (slots || []).reduce((sum, slot) => sum + (Number(slot.duration_minutes) || 0), 0)
  const hours = total / 60
  return Number.isInteger(hours) ? String(hours) : hours.toFixed(1)
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
