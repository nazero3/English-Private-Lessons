/** Preset chips for end-of-lesson wrap-up (stored in note_tags). */

export const PERFORMANCE_NOTE_PRESETS = [
  'Excellent participation',
  'Good progress',
  'Needs more practice',
  'Low focus today',
  'Confident with material',
  'Struggled with material',
]

export const FOCUS_NOTE_PRESETS = [
  'Grammar',
  'Vocabulary',
  'Reading',
  'Writing',
  'Listening',
  'Speaking',
  'Homework review',
  'Exam practice',
  'Unit review',
]

export const ALL_NOTE_PRESETS = [...PERFORMANCE_NOTE_PRESETS, ...FOCUS_NOTE_PRESETS]

/** Round elapsed ms to nearest quarter-hour, clamped to 0.5–24 (matches backend). */
export function hoursFromDurationMs(ms) {
  const raw = Math.max(0, Number(ms) || 0) / 3600000
  let rounded = Math.round(raw * 4) / 4
  if (rounded < 0.5) rounded = 0.5
  return Math.min(24, rounded)
}

export function formatNoteTags(tags) {
  if (!Array.isArray(tags) || !tags.length) return ''
  return tags.filter(Boolean).join(' · ')
}
