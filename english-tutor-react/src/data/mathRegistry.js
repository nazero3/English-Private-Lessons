import { MATH_GRADE9_COURSES } from './mathGrade9'
import { MATH_GRADE12_COURSES } from './mathGrade12'
import { getMathLessonFlow, resolveMathUnit } from './mathShared'

export const MATH_GRADES = {
  grade9: {
    key: 'grade9',
    title: 'رياضيات الصف التاسع',
    subtitle: 'الجبر والهندسة — منهاج سوري',
    courses: MATH_GRADE9_COURSES,
    permissionField: 'can_access_math_grade9',
    basePath: '/teacher/math/grade9',
  },
  grade12: {
    key: 'grade12',
    title: 'رياضيات البكالوريا',
    subtitle: 'الجزء الأول والثاني — منهاج سوري',
    courses: MATH_GRADE12_COURSES,
    permissionField: 'can_access_math_grade12',
    basePath: '/teacher/math/grade12',
  },
}

export function getMathGrade(gradeKey) {
  return MATH_GRADES[gradeKey] ?? null
}

export function getMathCourse(gradeKey, courseId) {
  const grade = getMathGrade(gradeKey)
  return grade?.courses.find((c) => c.id === courseId) ?? null
}

export function getMathCourseById(courseId) {
  for (const grade of Object.values(MATH_GRADES)) {
    const course = grade.courses.find((c) => c.id === courseId)
    if (course) return { grade, course }
  }
  return null
}

export function getMathUnit(gradeKey, courseId, fileNumber) {
  const course = getMathCourse(gradeKey, courseId)
  if (!course) return null
  return resolveMathUnit(course, fileNumber)
}

/** Lookup by course id (print routes, shared sheets). */
export function getMathUnitByCourseId(courseId, fileNumber) {
  const found = getMathCourseById(courseId)
  if (!found) return null
  return resolveMathUnit(found.course, fileNumber)
}

export { getMathLessonFlow }
