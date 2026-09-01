import { buildReviewQuiz, normalizeAnswer, reviewUnitNumbers, scoreFill, scoreMcq } from './sheets'

/** Strip grading keys — mirrors Postgres get_review_quiz. */
export function stripQuizAnswerKeys(items) {
  return (items || []).map((item) => {
    const { answer, correct, a, ...safe } = item
    return safe
  })
}

/**
 * Local mirror of get_review_quiz(lesson_id).
 * Returns the same shape as the Postgres RPC, with answer/correct removed.
 */
export function buildSafeReviewQuizPayload(currentLesson, relatedLessons, targetCount = 11) {
  const units = reviewUnitNumbers(currentLesson.unit_number)
  if (!units.length) {
    throw new Error('Review quiz is only available on units 3, 6, 9, and 12.')
  }
  const lessons = relatedLessons.filter((l) => units.includes(l.unit_number))
  const picked = buildReviewQuiz(lessons, targetCount)
  return {
    lessonId: currentLesson.id,
    courseId: currentLesson.course_id,
    unitNumber: currentLesson.unit_number,
    units,
    items: stripQuizAnswerKeys(picked),
  }
}

/**
 * Local mirror of grade_review_quiz(lesson_id, answers).
 * Uses the full bank only in-memory; never returns expected answers.
 */
export function gradeReviewQuizLocal(currentLesson, relatedLessons, answers, targetCount = 11) {
  const units = reviewUnitNumbers(currentLesson.unit_number)
  if (!units.length) {
    throw new Error('Review quiz is only available on units 3, 6, 9, and 12.')
  }
  const lessons = relatedLessons.filter((l) => units.includes(l.unit_number))
  const picked = buildReviewQuiz(lessons, targetCount)
  let correct = 0
  let total = 0
  const results = []

  picked.forEach((item) => {
    const key = item.compositeId || item.id
    const student = answers?.[key]
    if (item.type === 'mcq' && item.correct !== undefined && item.correct !== null) {
      total += 1
      const ok = scoreMcq(student, item.correct)
      if (ok) correct += 1
      results.push({ compositeId: key, ok })
    } else if (item.type === 'fill' && item.answer) {
      total += 1
      const ok = scoreFill(student, item.answer)
      if (ok) correct += 1
      results.push({ compositeId: key, ok: Boolean(ok) })
    }
  })

  return { correct, total, results }
}

export { normalizeAnswer }
