export function normalizeAnswer(value) {
  return String(value ?? '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
}

export function scoreFill(answer, expected) {
  if (!expected) return null
  return normalizeAnswer(answer) === normalizeAnswer(expected)
}

export function scoreMcq(answerIndex, correctIndex) {
  return Number(answerIndex) === Number(correctIndex)
}

/** Build a ~10–12 item review quiz from up to 3 lessons (N-2..N). */
export function buildReviewQuiz(lessons, targetCount = 11) {
  const pool = []
  lessons.forEach((lesson) => {
    ;(lesson.quiz_bank || []).forEach((item) => {
      pool.push({
        ...item,
        sourceUnit: lesson.unit_number,
        sourceTheme: lesson.theme,
        sourceGrammar: lesson.grammar,
        compositeId: `${lesson.id}:${item.id}`,
      })
    })
  })

  // Prefer mix: take MCQs first then fills, round-robin by unit
  const byUnit = new Map()
  pool.forEach((item) => {
    if (!byUnit.has(item.sourceUnit)) byUnit.set(item.sourceUnit, [])
    byUnit.get(item.sourceUnit).push(item)
  })

  const units = [...byUnit.keys()].sort((a, b) => a - b)
  const picked = []
  let guard = 0
  while (picked.length < targetCount && guard < targetCount * 20) {
    guard += 1
    let added = false
    for (const u of units) {
      const arr = byUnit.get(u)
      if (!arr?.length) continue
      // Prefer unused types alternating
      const preferMcq = picked.length % 2 === 0
      const idx = arr.findIndex((x) => (preferMcq ? x.type === 'mcq' : x.type === 'fill'))
      const takeAt = idx >= 0 ? idx : 0
      picked.push(arr.splice(takeAt, 1)[0])
      added = true
      if (picked.length >= targetCount) break
    }
    if (!added) break
  }

  return picked
}

/** Checkpoint quiz only on units 3, 6, 9, 12 (end of each 3-unit block). */
export function isReviewQuizUnit(unitNumber) {
  const n = Number(unitNumber)
  return Number.isFinite(n) && n > 0 && n % 3 === 0
}

/**
 * Units covered by the checkpoint quiz at unit N.
 * Unit 3 → [1,2,3], unit 6 → [4,5,6], etc.
 * Non-checkpoint units → [].
 */
export function reviewUnitNumbers(currentUnit) {
  const n = Number(currentUnit)
  if (!isReviewQuizUnit(n)) return []
  return [n - 2, n - 1, n]
}
