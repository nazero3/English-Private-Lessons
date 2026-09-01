/** Whether the user may open English File private lessons. */
export function canAccessPrivateLessons(profile) {
  if (!profile) return false
  if (profile.role === 'manager') return true
  return Boolean(profile.can_access_private_lessons)
}

/** Whether the user may open Grade 9 Math (Algebra + Geometry). */
export function canAccessMathGrade9(profile) {
  if (!profile) return false
  if (profile.role === 'manager') return true
  return Boolean(profile.can_access_math_grade9)
}

/** Whether the user may open Grade 12 Math (Baccalaureate f1 + f2). */
export function canAccessMathGrade12(profile) {
  if (!profile) return false
  if (profile.role === 'manager') return true
  return Boolean(profile.can_access_math_grade12)
}

export function canAccessMathGrade(profile, gradeKey) {
  if (gradeKey === 'grade12') return canAccessMathGrade12(profile)
  if (gradeKey === 'grade9') return canAccessMathGrade9(profile)
  return false
}

/** Whether the user may open Grade 12 Physics (Baccalaureate). */
export function canAccessPhysicsGrade12(profile) {
  if (!profile) return false
  if (profile.role === 'manager') return true
  return Boolean(profile.can_access_physics_grade12)
}

export function canAccessCoursebookGrade(profile, subjectKey, gradeKey) {
  if (subjectKey === 'physics' && gradeKey === 'grade12') return canAccessPhysicsGrade12(profile)
  return canAccessMathGrade(profile, gradeKey)
}

export function homePath(role) {
  if (role === 'manager') return '/manager'
  if (role === 'student') return '/student'
  if (role === 'operations') return '/operations'
  return '/teacher'
}

export function appDisplayName(role) {
  if (role === 'student' || role === 'parent') return 'Kinz Platform'
  return 'Kinz Teacher Platform'
}

export function isStaff(role) {
  return role === 'manager' || role === 'teacher'
}

export function canSeeAllSessions(role) {
  return role === 'manager' || role === 'operations'
}
