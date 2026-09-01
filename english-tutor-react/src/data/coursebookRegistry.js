import { MATH_GRADES, getMathCourseById, getMathUnitByCourseId } from './mathRegistry'
import { PHYSICS_GRADES, getPhysicsCourseById, getPhysicsUnitByCourseId } from './physicsRegistry'
import { getMathLessonFlow, resolveMathUnit } from './mathShared'

export const COURSEBOOK_SUBJECTS = {
  math: { grades: MATH_GRADES, printPrefix: 'math' },
  physics: { grades: PHYSICS_GRADES, printPrefix: 'physics' },
}

export function getCoursebookGrade(subjectKey, gradeKey) {
  return COURSEBOOK_SUBJECTS[subjectKey]?.grades[gradeKey] ?? null
}

export function getCoursebookCourse(subjectKey, gradeKey, courseId) {
  const grade = getCoursebookGrade(subjectKey, gradeKey)
  return grade?.courses.find((c) => c.id === courseId) ?? null
}

export function getCoursebookUnit(subjectKey, gradeKey, courseId, fileNumber) {
  const course = getCoursebookCourse(subjectKey, gradeKey, courseId)
  if (!course) return null
  return resolveMathUnit(course, fileNumber)
}

export function getCoursebookCourseById(courseId) {
  const math = getMathCourseById(courseId)
  if (math) return { subjectKey: 'math', printPrefix: 'math', ...math }
  const physics = getPhysicsCourseById(courseId)
  if (physics) return { subjectKey: 'physics', printPrefix: 'physics', ...physics }
  return null
}

export function getCoursebookUnitByCourseId(courseId, fileNumber) {
  const unit = getMathUnitByCourseId(courseId, fileNumber)
  if (unit) return unit
  return getPhysicsUnitByCourseId(courseId, fileNumber)
}

export { getMathLessonFlow as getCoursebookLessonFlow }
