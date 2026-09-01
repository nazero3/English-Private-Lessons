import { ENGLISH_FILE_COURSES } from '../data/englishFile'
import { MATH_GRADES } from '../data/mathRegistry'
import { PHYSICS_GRADES } from '../data/physicsRegistry'
import {
  canAccessMathGrade12,
  canAccessMathGrade9,
  canAccessPhysicsGrade12,
  canAccessPrivateLessons,
} from './permissions'

function packItem(course) {
  return {
    key: `pack:${course.id}`,
    kind: 'pack',
    id: course.id,
    title: course.title,
    curriculum: null,
  }
}

function fileUnits(course, labelPrefix) {
  return (course.files || []).map((file) => ({
    id: String(file.file),
    label: `${labelPrefix}${file.file}. ${file.title}`,
    unit_number: file.file,
    theme: file.title,
  }))
}

export function buildLogCourses(packCourses, profile) {
  const items = (packCourses || []).map(packItem)

  if (canAccessPrivateLessons(profile)) {
    for (const course of ENGLISH_FILE_COURSES) {
      items.push({
        key: `ef:${course.id}`,
        kind: 'catalog',
        id: course.id,
        title: `${course.title} ${course.subtitle}`,
        curriculum: 'english_file',
        catalog: course,
        unitPrefix: 'File ',
      })
    }
  }

  const mathGrades = [
    canAccessMathGrade9(profile) ? MATH_GRADES.grade9 : null,
    canAccessMathGrade12(profile) ? MATH_GRADES.grade12 : null,
  ].filter(Boolean)

  for (const grade of mathGrades) {
    for (const course of grade.courses) {
      items.push({
        key: `math:${course.id}`,
        kind: 'catalog',
        id: course.id,
        title: course.subtitle || course.title,
        curriculum: grade.key === 'grade12' ? 'math_grade12' : 'math_grade9',
        catalog: course,
        unitPrefix: 'U',
      })
    }
  }

  if (canAccessPhysicsGrade12(profile)) {
    for (const course of PHYSICS_GRADES.grade12.courses) {
      items.push({
        key: `physics:${course.id}`,
        kind: 'catalog',
        id: course.id,
        title: course.subtitle || course.title,
        curriculum: 'physics_grade12',
        catalog: course,
        unitPrefix: 'U',
      })
    }
  }

  return items
}

export function unitsForLogCourse(course) {
  if (!course || course.kind !== 'catalog') return []
  return fileUnits(course.catalog, course.unitPrefix || '')
}
