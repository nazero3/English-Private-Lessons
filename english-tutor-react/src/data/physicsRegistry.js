import { PHYSICS_GRADE12_COURSES } from './physicsGrade12'
import { getMathLessonFlow, resolveMathUnit } from './mathShared'

export const PHYSICS_GRADES = {
  grade12: {
    key: 'grade12',
    title: 'فيزياء البكالوريا',
    subtitle: 'الصف الثالث الثانوي العلمي — منهاج سوري',
    courses: PHYSICS_GRADE12_COURSES,
    permissionField: 'can_access_physics_grade12',
    basePath: '/teacher/physics/grade12',
  },
}

export function getPhysicsGrade(gradeKey) {
  return PHYSICS_GRADES[gradeKey] ?? null
}

export function getPhysicsCourse(gradeKey, courseId) {
  const grade = getPhysicsGrade(gradeKey)
  return grade?.courses.find((c) => c.id === courseId) ?? null
}

export function getPhysicsCourseById(courseId) {
  for (const grade of Object.values(PHYSICS_GRADES)) {
    const course = grade.courses.find((c) => c.id === courseId)
    if (course) return { grade, course }
  }
  return null
}

export function getPhysicsUnit(gradeKey, courseId, fileNumber) {
  const course = getPhysicsCourse(gradeKey, courseId)
  if (!course) return null
  return resolveMathUnit(course, fileNumber)
}

export function getPhysicsUnitByCourseId(courseId, fileNumber) {
  const found = getPhysicsCourseById(courseId)
  if (!found) return null
  return resolveMathUnit(found.course, fileNumber)
}

export { getMathLessonFlow as getPhysicsLessonFlow }
