import { courseKey } from './labels'

/**
 * Parent reading of a child payload.
 *
 * The API (parent_progress.py) is the source of these two lists. If `courses`
 * or `learned` is missing, this derives the same view from the session fields
 * an older server still sends. An empty list from the server is kept.
 */

function percent(score, total) {
  if (score == null || total == null || Number(total) === 0) return null
  return Math.round((Number(score) / Number(total)) * 1000) / 10
}

function average(values) {
  if (!values.length) return null
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10
}

export function learnedLines({ grammar = '', objectives = [], title = '' } = {}) {
  const heading = String(title || '').trim()
  const lines = []
  const seen = new Set()
  const add = (text) => {
    const cleaned = String(text || '').trim()
    if (!cleaned || cleaned === heading || seen.has(cleaned)) return
    seen.add(cleaned)
    lines.push(cleaned)
  }
  add(grammar)
  for (const item of objectives || []) {
    if (typeof item === 'string') add(item)
  }
  return lines
}

export function courseRollups(sessions) {
  const groups = new Map()
  for (const session of sessions || []) {
    const course = session.course || {}
    const key = courseKey(course)
    let bucket = groups.get(key)
    if (!bucket) {
      bucket = {
        id: course.id ?? null,
        title: String(course.title || '').trim(),
        grade: String(course.grade || '').trim(),
        lessons_count: 0,
        last_session_date: session.session_date || null,
        percents: [],
      }
      groups.set(key, bucket)
    }
    bucket.lessons_count += 1
    for (const [score, total] of [
      ['worksheet_score', 'worksheet_total'],
      ['quiz_score', 'quiz_total'],
      ['homework_score', 'homework_total'],
    ]) {
      const value = percent(session[score], session[total])
      if (value != null) bucket.percents.push(value)
    }
  }
  return [...groups.values()].map((bucket) => ({
    id: bucket.id,
    title: bucket.title,
    grade: bucket.grade,
    lessons_count: bucket.lessons_count,
    last_session_date: bucket.last_session_date,
    overall_avg: average(bucket.percents),
  }))
}

export function coursesFor(child) {
  if (Array.isArray(child?.courses)) return child.courses
  return courseRollups(child?.sessions)
}

export function learnedFor(session) {
  if (Array.isArray(session?.learned)) return session.learned
  const lesson = session?.lesson
  return learnedLines({
    grammar: lesson?.grammar || '',
    objectives: lesson?.objectives,
    title: lesson?.theme || '',
  })
}
