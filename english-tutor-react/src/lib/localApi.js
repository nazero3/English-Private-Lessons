import { ENRICHED_LESSONS } from '../data/enrichedLessons'
import { buildSafeReviewQuizPayload, gradeReviewQuizLocal } from './reviewQuiz'
import { reviewUnitNumbers } from './sheets'

const STORAGE_KEY = 'lessonSheetsLocalV1'

const SEED_USERS = [
  {
    id: 'mgr-001',
    email: 'manager@lesson-sheets.app',
    password: 'changeme',
    full_name: 'Manager',
    role: 'manager',
  },
  {
    id: 'tch-001',
    email: 'teacher@lesson-sheets.app',
    password: 'changeme',
    full_name: 'Teacher',
    role: 'teacher',
  },
  {
    id: 'ops-001',
    email: 'ops@lesson-sheets.app',
    password: 'changeme',
    full_name: 'Operations',
    role: 'operations',
  },
]

function uid(prefix = 'id') {
  return `${prefix}-${crypto.randomUUID()}`
}

function buildSeed() {
  const courses = [
    {
      id: 'course-g9',
      code: 'grade_9',
      title: 'Grade 9 English',
      grade: '9',
    },
    {
      id: 'course-g12',
      code: 'grade_12',
      title: 'Grade 12 English',
      grade: '12',
    },
  ]

  const lessons = ENRICHED_LESSONS.map((l) => {
    const course = courses.find((c) => c.grade === l.grade)
    return {
      id: `lesson-${l.grade}-${l.unit_number}`,
      course_id: course.id,
      unit_number: l.unit_number,
      theme: l.theme,
      grammar: l.grammar,
      arabic: l.arabic,
      explanation: l.explanation,
      visual: l.visual,
      objectives: l.objectives,
      session_flow: l.session_flow,
      common_mistakes: l.common_mistakes,
      teacher_notes: l.teacher_notes,
      worksheet: l.worksheet,
      homework: l.homework,
      quiz_bank: l.quiz_bank,
      updated_at: new Date().toISOString(),
    }
  })

  return {
    users: SEED_USERS,
    profiles: SEED_USERS.map(({ id, full_name, role, email }) => ({
      id,
      full_name,
      role,
      email,
      can_access_private_lessons: role === 'manager',
      can_access_math_grade9: role === 'manager',
      can_access_math_grade12: role === 'manager',
      can_access_physics_grade12: role === 'manager',
    })),
    courses,
    lessons,
    assignments: [
      {
        id: 'asg-1',
        teacher_id: 'tch-001',
        course_id: 'course-g9',
      },
    ],
    sessions: [],
    students: [
      {
        id: 'stu-001',
        full_name: 'Sara',
        teacher_id: 'tch-001',
        created_at: new Date().toISOString(),
      },
    ],
    scores: [],
    notifications: [],
    sessionUserId: null,
  }
}

function read() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const db = JSON.parse(raw)
      migrateDb(db)
      return db
    }
  } catch {
    /* fall through */
  }
  const seed = buildSeed()
  write(seed)
  return seed
}

function migrateDb(db) {
  let changed = false

  const legacyUsers = {
    'manager@demo.local': {
      email: 'manager@lesson-sheets.app',
      full_name: 'Manager',
      password: 'changeme',
    },
    'teacher@demo.local': {
      email: 'teacher@lesson-sheets.app',
      full_name: 'Teacher',
      password: 'changeme',
    },
  }

  for (const user of db.users || []) {
    const legacy = legacyUsers[user.email?.toLowerCase()]
    if (legacy) {
      user.email = legacy.email
      user.full_name = legacy.full_name
      if (user.password === 'demo1234') user.password = legacy.password
      changed = true
    } else if (user.full_name?.startsWith('Demo ')) {
      user.full_name = user.full_name.replace(/^Demo\s+/, '')
      changed = true
    }
  }

  for (const profile of db.profiles || []) {
    const user = (db.users || []).find((u) => u.id === profile.id)
    if (user) {
      profile.email = user.email
      profile.full_name = user.full_name
    }
    if (profile.can_access_private_lessons === undefined) {
      profile.can_access_private_lessons = profile.role === 'manager'
      changed = true
    }
    if (profile.can_access_math_grade9 === undefined) {
      profile.can_access_math_grade9 = profile.role === 'manager'
      changed = true
    }
    if (profile.can_access_math_grade12 === undefined) {
      profile.can_access_math_grade12 = profile.role === 'manager'
      changed = true
    }
    if (profile.can_access_physics_grade12 === undefined) {
      profile.can_access_physics_grade12 = profile.role === 'manager'
      changed = true
    }
  }
  if (!Array.isArray(db.students)) {
    db.students = []
    changed = true
  }
  if (!Array.isArray(db.notifications)) {
    db.notifications = []
    changed = true
  }
  if (!Array.isArray(db.scores)) {
    db.scores = []
    changed = true
  }
  for (const session of db.sessions || []) {
    if (session.manager_feedback === undefined) {
      session.manager_feedback = ''
      session.manager_feedback_at = null
      session.manager_id = null
      changed = true
    }
  }
  if (changed) write(db)
}

function write(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function withDb(mutator) {
  const db = read()
  const result = mutator(db)
  write(db)
  return result
}

function pct(score, total) {
  if (score == null || !total) return null
  return Math.round((Number(score) / Number(total)) * 1000) / 10
}

function avg(values) {
  const nums = values.filter((v) => v != null)
  if (!nums.length) return null
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10
}

function localPortal(db, student) {
  const sessions = (db.sessions || [])
    .filter(
      (s) =>
        s.student_id === student.id ||
        (student.teacher_id &&
          s.teacher_id === student.teacher_id &&
          String(s.student_name || '').toLowerCase() === student.full_name.toLowerCase()),
    )
    .map((s) => {
      const lesson = db.lessons.find((l) => l.id === s.lesson_id)
      const course = db.courses.find((c) => c.id === lesson?.course_id)
      return {
        ...s,
        homework_assigned: s.homework_assigned || '',
        homework: (lesson?.homework || []).map((item) => ({
          id: item.id,
          type: item.type,
          prompt: item.prompt,
          options: item.options,
        })),
        lesson: lesson
          ? {
              id: lesson.id,
              course_id: lesson.course_id,
              unit_number: lesson.unit_number,
              theme: lesson.theme,
              grammar: lesson.grammar,
              course: course ? { id: course.id, title: course.title, grade: course.grade } : null,
            }
          : null,
        course: course ? { id: course.id, title: course.title, grade: course.grade } : null,
      }
    })
  const scores = (db.scores || []).filter((s) => s.student_id === student.id)
  const summary = {
    tests_count: scores.length,
    lessons_count: sessions.length,
    worksheet_avg: avg(sessions.map((s) => pct(s.worksheet_score, s.worksheet_total))),
    quiz_avg: avg(sessions.map((s) => pct(s.quiz_score, s.quiz_total))),
    homework_avg: avg(sessions.map((s) => pct(s.homework_score, s.homework_total))),
    tests_avg: avg(scores.map((s) => pct(s.score, s.total))),
    overall_avg: avg([
      ...sessions.map((s) => pct(s.worksheet_score, s.worksheet_total)),
      ...sessions.map((s) => pct(s.quiz_score, s.quiz_total)),
      ...sessions.map((s) => pct(s.homework_score, s.homework_total)),
      ...scores.map((s) => pct(s.score, s.total)),
    ]),
  }
  const user = db.users.find((u) => u.id === student.user_id)
  return {
    student: {
      ...student,
      email: user?.email || student.email || null,
      has_login: Boolean(student.user_id),
      teacher: db.profiles.find((p) => p.id === student.teacher_id) || null,
    },
    sessions,
    scores,
    summary,
  }
}

export const localApi = {
  reset() {
    localStorage.removeItem(STORAGE_KEY)
    return buildSeed()
  },

  async getSession() {
    const db = read()
    if (!db.sessionUserId) return { user: null, profile: null }
    const profile = db.profiles.find((p) => p.id === db.sessionUserId)
    const user = db.users.find((u) => u.id === db.sessionUserId)
    if (!profile || !user) return { user: null, profile: null }
    return {
      user: { id: user.id, email: user.email },
      profile,
    }
  },

  async signIn(email, password) {
    return withDb((db) => {
      const user = db.users.find(
        (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password,
      )
      if (!user) throw new Error('Invalid email or password')
      db.sessionUserId = user.id
      const profile = db.profiles.find((p) => p.id === user.id)
      return { user: { id: user.id, email: user.email }, profile }
    })
  },

  async signOut() {
    return withDb((db) => {
      db.sessionUserId = null
      return null
    })
  },

  async listProfiles() {
    const db = read()
    return db.profiles
  },

  async updateProfileRole(profileId, role) {
    return withDb((db) => {
      const p = db.profiles.find((x) => x.id === profileId)
      if (!p) throw new Error('Profile not found')
      p.role = role
      const u = db.users.find((x) => x.id === profileId)
      if (u) u.role = role
      return p
    })
  },

  async createTeacher({ email, password, full_name }) {
    return withDb((db) => {
      if (db.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
        throw new Error('Email already exists')
      }
      const id = uid('tch')
      db.users.push({ id, email, password, full_name, role: 'teacher' })
      const profile = {
        id,
        email,
        full_name,
        role: 'teacher',
        can_access_private_lessons: false,
        can_access_math_grade9: false,
        can_access_math_grade12: false,
        can_access_physics_grade12: false,
      }
      db.profiles.push(profile)
      return profile
    })
  },

  async updateTeacher(teacherId, { email, password, full_name }) {
    return withDb((db) => {
      const profile = db.profiles.find((p) => p.id === teacherId)
      const user = db.users.find((u) => u.id === teacherId)
      if (!profile || !user) throw new Error('Teacher not found')
      if (profile.role !== 'teacher') throw new Error('Only teacher accounts can be edited here')

      const nextEmail = String(email || '').trim()
      const nextName = String(full_name || '').trim()
      if (!nextEmail || !nextName) throw new Error('Name and email are required')

      const emailTaken = db.users.some(
        (u) => u.id !== teacherId && u.email.toLowerCase() === nextEmail.toLowerCase(),
      )
      if (emailTaken) throw new Error('Email already exists')

      user.email = nextEmail
      user.full_name = nextName
      profile.email = nextEmail
      profile.full_name = nextName

      if (password && String(password).trim()) {
        if (String(password).trim().length < 6) {
          throw new Error('Password must be at least 6 characters')
        }
        user.password = String(password).trim()
      }

      return profile
    })
  },

  async deleteTeacher(teacherId) {
    return withDb((db) => {
      const profile = db.profiles.find((p) => p.id === teacherId)
      if (!profile) throw new Error('Teacher not found')
      if (profile.role !== 'teacher') throw new Error('Only teacher accounts can be deleted here')
      if (db.sessionUserId === teacherId) {
        throw new Error('You cannot delete the account you are signed in with')
      }

      const manager = db.profiles.find((p) => p.role === 'manager')
      const unassigned = (db.students || []).filter((s) => s.teacher_id === teacherId)
      unassigned.forEach((s) => {
        s.teacher_id = null
      })
      if (manager) {
        db.sessions = (db.sessions || []).map((s) =>
          s.teacher_id === teacherId ? { ...s, teacher_id: manager.id } : s,
        )
        db.scores = (db.scores || []).map((s) =>
          s.teacher_id === teacherId ? { ...s, teacher_id: manager.id } : s,
        )
        if (unassigned.length) {
          const names = unassigned.map((s) => s.full_name).filter(Boolean)
          const shown = names.slice(0, 12).join(', ')
          const extra = names.length > 12 ? ` and ${names.length - 12} more` : ''
          if (!Array.isArray(db.notifications)) db.notifications = []
          db.notifications.unshift({
            id: uid('note'),
            user_id: manager.id,
            session_id: null,
            type: 'unassigned_students',
            title: 'Students need a teacher',
            message: `${profile.full_name} was removed. Assign a teacher to ${names.length} student${
              names.length === 1 ? '' : 's'
            }: ${shown}${extra}.`,
            read: false,
            created_at: new Date().toISOString(),
          })
        }
      }
      db.users = db.users.filter((u) => u.id !== teacherId)
      db.profiles = db.profiles.filter((p) => p.id !== teacherId)
      db.assignments = db.assignments.filter((a) => a.teacher_id !== teacherId)
      db.notifications = (db.notifications || []).filter((n) => n.user_id !== teacherId)
      return {
        id: teacherId,
        unassigned_count: unassigned.length,
        unassigned_names: unassigned.map((s) => s.full_name),
      }
    })
  },

  async createOperations({ email, password, full_name }) {
    return withDb((db) => {
      if (db.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
        throw new Error('Email already exists')
      }
      const id = uid('ops')
      db.users.push({ id, email, password, full_name, role: 'operations' })
      const profile = {
        id,
        email,
        full_name,
        role: 'operations',
        can_access_private_lessons: false,
        can_access_math_grade9: false,
        can_access_math_grade12: false,
        can_access_physics_grade12: false,
      }
      db.profiles.push(profile)
      return profile
    })
  },

  async updateOperations(opsId, { email, password, full_name }) {
    return withDb((db) => {
      const profile = db.profiles.find((p) => p.id === opsId)
      const user = db.users.find((u) => u.id === opsId)
      if (!profile || !user) throw new Error('Operations account not found')
      if (profile.role !== 'operations') throw new Error('Only operations accounts can be edited here')

      const nextEmail = String(email || '').trim()
      const nextName = String(full_name || '').trim()
      if (!nextEmail || !nextName) throw new Error('Name and email are required')

      const emailTaken = db.users.some(
        (u) => u.id !== opsId && u.email.toLowerCase() === nextEmail.toLowerCase(),
      )
      if (emailTaken) throw new Error('Email already exists')

      user.email = nextEmail
      user.full_name = nextName
      profile.email = nextEmail
      profile.full_name = nextName

      if (password && String(password).trim()) {
        if (String(password).trim().length < 6) {
          throw new Error('Password must be at least 6 characters')
        }
        user.password = String(password).trim()
      }

      return profile
    })
  },

  async deleteOperations(opsId) {
    return withDb((db) => {
      const profile = db.profiles.find((p) => p.id === opsId)
      if (!profile) throw new Error('Operations account not found')
      if (profile.role !== 'operations') throw new Error('Only operations accounts can be deleted here')
      if (db.sessionUserId === opsId) {
        throw new Error('You cannot delete the account you are signed in with')
      }
      db.users = db.users.filter((u) => u.id !== opsId)
      db.profiles = db.profiles.filter((p) => p.id !== opsId)
      return { id: opsId }
    })
  },

  async listCourses(profile) {
    const db = read()
    if (profile?.asManager || profile?.role === 'manager') return db.courses
    const teacherId = profile?.teacherId || profile?.id
    const assigned = new Set(
      db.assignments.filter((a) => a.teacher_id === teacherId).map((a) => a.course_id),
    )
    return db.courses.filter((c) => assigned.has(c.id))
  },

  async listLessons(courseId) {
    const db = read()
    return db.lessons
      .filter((l) => l.course_id === courseId)
      .sort((a, b) => a.unit_number - b.unit_number)
  },

  async getLesson(lessonId) {
    const db = read()
    const lesson = db.lessons.find((l) => l.id === lessonId)
    if (!lesson) throw new Error('Lesson not found')
    const course = db.courses.find((c) => c.id === lesson.course_id)
    return { ...lesson, course }
  },

  async getLessonsByUnits(courseId, unitNumbers) {
    const db = read()
    return db.lessons
      .filter((l) => l.course_id === courseId && unitNumbers.includes(l.unit_number))
      .sort((a, b) => a.unit_number - b.unit_number)
  },

  async getReviewQuiz(lessonId) {
    const db = read()
    const lesson = db.lessons.find((l) => l.id === lessonId)
    if (!lesson) throw new Error('Lesson not found')
    const units = reviewUnitNumbers(lesson.unit_number)
    if (!units.length) {
      throw new Error('Review quiz is only available on units 3, 6, 9, and 12.')
    }
    const related = db.lessons.filter(
      (l) => l.course_id === lesson.course_id && units.includes(l.unit_number),
    )
    const course = db.courses.find((c) => c.id === lesson.course_id)
    const payload = buildSafeReviewQuizPayload(lesson, related)
    return {
      ...payload,
      course,
      lessonsMeta: related.map((l) => ({
        id: l.id,
        unit_number: l.unit_number,
        theme: l.theme,
        grammar: l.grammar,
      })),
    }
  },

  async gradeReviewQuiz(lessonId, answers) {
    const db = read()
    const lesson = db.lessons.find((l) => l.id === lessonId)
    if (!lesson) throw new Error('Lesson not found')
    const units = reviewUnitNumbers(lesson.unit_number)
    if (!units.length) {
      throw new Error('Review quiz is only available on units 3, 6, 9, and 12.')
    }
    const related = db.lessons.filter(
      (l) => l.course_id === lesson.course_id && units.includes(l.unit_number),
    )
    return gradeReviewQuizLocal(lesson, related, answers)
  },

  async updateLesson(lessonId, patch) {
    return withDb((db) => {
      const idx = db.lessons.findIndex((l) => l.id === lessonId)
      if (idx < 0) throw new Error('Lesson not found')
      db.lessons[idx] = {
        ...db.lessons[idx],
        ...patch,
        updated_at: new Date().toISOString(),
      }
      return db.lessons[idx]
    })
  },

  async listAssignments() {
    const db = read()
    return db.assignments.map((a) => ({
      ...a,
      teacher: db.profiles.find((p) => p.id === a.teacher_id),
      course: db.courses.find((c) => c.id === a.course_id),
    }))
  },

  async setAssignment(teacherId, courseId, assigned) {
    return withDb((db) => {
      const existing = db.assignments.findIndex(
        (a) => a.teacher_id === teacherId && a.course_id === courseId,
      )
      if (assigned && existing < 0) {
        db.assignments.push({ id: uid('asg'), teacher_id: teacherId, course_id: courseId })
      } else if (!assigned && existing >= 0) {
        db.assignments.splice(existing, 1)
      }
      return db.assignments
    })
  },

  async setPrivateLessonsAccess(teacherId, enabled) {
    return withDb((db) => {
      const teacher = db.profiles.find((p) => p.id === teacherId)
      if (!teacher) throw new Error('Teacher not found')
      if (teacher.role !== 'teacher') {
        throw new Error('Private lessons access applies to teachers only')
      }
      teacher.can_access_private_lessons = Boolean(enabled)
      return teacher
    })
  },

  async setMathGrade9Access(teacherId, enabled) {
    return withDb((db) => {
      const teacher = db.profiles.find((p) => p.id === teacherId)
      if (!teacher) throw new Error('Teacher not found')
      if (teacher.role !== 'teacher') {
        throw new Error('Math Grade 9 access applies to teachers only')
      }
      teacher.can_access_math_grade9 = Boolean(enabled)
      return teacher
    })
  },

  async setMathGrade12Access(teacherId, enabled) {
    return withDb((db) => {
      const teacher = db.profiles.find((p) => p.id === teacherId)
      if (!teacher) throw new Error('Teacher not found')
      if (teacher.role !== 'teacher') {
        throw new Error('Math Grade 12 access applies to teachers only')
      }
      teacher.can_access_math_grade12 = Boolean(enabled)
      return teacher
    })
  },

  async setPhysicsGrade12Access(teacherId, enabled) {
    return withDb((db) => {
      const teacher = db.profiles.find((p) => p.id === teacherId)
      if (!teacher) throw new Error('Teacher not found')
      if (teacher.role !== 'teacher') {
        throw new Error('Physics Grade 12 access applies to teachers only')
      }
      teacher.can_access_physics_grade12 = Boolean(enabled)
      return teacher
    })
  },

  async listStudents(profile) {
    const db = read()
    const decorate = (s) => ({
      ...s,
      teacher: s.teacher_id ? db.profiles.find((p) => p.id === s.teacher_id) || null : null,
    })
    const rows = (db.students || []).map(decorate)
    const sortRoster = (a, b) => {
      const au = a.teacher_id ? 1 : 0
      const bu = b.teacher_id ? 1 : 0
      if (au !== bu) return au - bu
      return String(a.full_name).localeCompare(String(b.full_name))
    }
    if (profile?.role === 'manager') {
      return [...rows].sort(sortRoster)
    }
    const teacherId = profile?.id
    return rows.filter((s) => s.teacher_id === teacherId).sort(sortRoster)
  },

  async createStudent(profile, payload) {
    return withDb((db) => {
      const body = typeof payload === 'string' ? { full_name: payload } : payload || {}
      const name = String(body.full_name || '').trim()
      if (!name) throw new Error('Student name is required')
      const teacherId = profile?.role === 'manager' ? body.teacher_id : profile?.id
      if (!teacherId) throw new Error('Teacher is required')
      const existing = (db.students || []).find(
        (s) => s.teacher_id === teacherId && s.full_name.toLowerCase() === name.toLowerCase(),
      )
      if (existing) return existing
      const email = String(body.email || '').trim().toLowerCase()
      let userId = null
      if (email && body.password) {
        if (db.users.some((u) => u.email.toLowerCase() === email)) {
          throw new Error('Email already exists')
        }
        userId = uid('stuuser')
        db.users.push({
          id: userId,
          email,
          password: body.password,
          full_name: name,
          role: 'student',
        })
        db.profiles.push({
          id: userId,
          email,
          full_name: name,
          role: 'student',
          can_access_private_lessons: false,
          can_access_math_grade9: false,
          can_access_math_grade12: false,
        can_access_physics_grade12: false,
        })
      }
      const row = {
        id: uid('stu'),
        full_name: name,
        teacher_id: teacherId,
        user_id: userId,
        email: email || null,
        has_login: Boolean(userId),
        created_at: new Date().toISOString(),
      }
      db.students.push(row)
      return row
    })
  },

  async getStudent(studentId) {
    const db = read()
    const student = (db.students || []).find((s) => s.id === studentId)
    if (!student) throw new Error('Student not found')
    return localPortal(db, student)
  },

  async updateStudent(studentId, payload) {
    return withDb((db) => {
      const student = (db.students || []).find((s) => s.id === studentId)
      if (!student) throw new Error('Student not found')
      if (payload.full_name) student.full_name = payload.full_name.trim()
      if (Object.prototype.hasOwnProperty.call(payload, 'teacher_id')) {
        student.teacher_id = payload.teacher_id || null
      }
      const email = String(payload.email || '').trim().toLowerCase()
      if (student.user_id) {
        const user = db.users.find((u) => u.id === student.user_id)
        const profile = db.profiles.find((p) => p.id === student.user_id)
        if (payload.full_name && profile) profile.full_name = student.full_name
        if (email && user) {
          user.email = email
          student.email = email
          if (profile) profile.email = email
        }
        if (payload.password && user) user.password = payload.password
      } else if (email && payload.password) {
        const userId = uid('stuuser')
        db.users.push({
          id: userId,
          email,
          password: payload.password,
          full_name: student.full_name,
          role: 'student',
        })
        db.profiles.push({
          id: userId,
          email,
          full_name: student.full_name,
          role: 'student',
          can_access_private_lessons: false,
          can_access_math_grade9: false,
          can_access_math_grade12: false,
        can_access_physics_grade12: false,
        })
        student.user_id = userId
        student.email = email
        student.has_login = true
      }
      return student
    })
  },

  async deleteStudent(studentId) {
    return withDb((db) => {
      const student = (db.students || []).find((s) => s.id === studentId)
      if (!student) throw new Error('Student not found')
      db.students = db.students.filter((s) => s.id !== studentId)
      db.scores = (db.scores || []).filter((s) => s.student_id !== studentId)
      db.sessions = (db.sessions || []).map((s) =>
        s.student_id === studentId ? { ...s, student_id: null } : s,
      )
      if (student.user_id) {
        db.users = db.users.filter((u) => u.id !== student.user_id)
        db.profiles = db.profiles.filter((p) => p.id !== student.user_id)
      }
      return { id: studentId }
    })
  },

  async getMyStudentPortal() {
    const db = read()
    const profile = db.profiles.find((p) => p.id === db.sessionUserId)
    if (!profile || profile.role !== 'student') throw new Error('Student access required')
    const student = (db.students || []).find((s) => s.user_id === profile.id)
    if (!student) throw new Error('Student profile not found')
    return localPortal(db, student)
  },

  async addStudentScore(studentId, payload) {
    return withDb((db) => {
      if (!db.scores) db.scores = []
      const row = {
        id: uid('score'),
        student_id: studentId,
        title: payload.title,
        score: payload.score ?? null,
        total: payload.total ?? null,
        notes: payload.notes || '',
        test_date: payload.test_date || new Date().toISOString(),
        created_at: new Date().toISOString(),
      }
      db.scores.unshift(row)
      return row
    })
  },

  async updateStudentScore(studentId, scoreId, payload) {
    return withDb((db) => {
      const row = (db.scores || []).find((s) => s.id === scoreId && s.student_id === studentId)
      if (!row) throw new Error('Score not found')
      Object.assign(row, payload)
      return row
    })
  },

  async deleteStudentScore(studentId, scoreId) {
    return withDb((db) => {
      db.scores = (db.scores || []).filter((s) => !(s.id === scoreId && s.student_id === studentId))
      return { id: scoreId }
    })
  },

  async updateSession(sessionId, payload) {
    return withDb((db) => {
      const session = db.sessions.find((s) => s.id === sessionId)
      if (!session) throw new Error('Session not found')
      Object.assign(session, payload)
      if (payload.lesson_id) {
        const lesson = db.lessons.find((l) => l.id === payload.lesson_id)
        if (lesson) {
          session.lesson = lesson
          session.course = db.courses.find((c) => c.id === lesson.course_id) || session.course
        }
      } else if (payload.course_title) {
        session.lesson_id = null
        session.course = { title: payload.course_title }
        session.lesson = {
          unit_number: payload.unit_number,
          theme: payload.unit_label || 'Lesson',
        }
      }
      return session
    })
  },

  async deleteSession(sessionId) {
    return withDb((db) => {
      db.sessions = db.sessions.filter((s) => s.id !== sessionId)
      return { id: sessionId }
    })
  },

  async createSession(payload) {
    return withDb((db) => {
      const studentName = String(payload.student_name || '').trim() || 'Student'
      if (payload.teacher_id && studentName) {
        const exists = (db.students || []).some(
          (s) =>
            s.teacher_id === payload.teacher_id &&
            s.full_name.toLowerCase() === studentName.toLowerCase(),
        )
        if (!exists) {
          db.students.push({
            id: uid('stu'),
            full_name: studentName,
            teacher_id: payload.teacher_id,
            created_at: new Date().toISOString(),
          })
        }
      }

      const row = {
        id: uid('sess'),
        created_at: new Date().toISOString(),
        session_date: payload.session_date || new Date().toISOString(),
        manager_feedback: '',
        manager_feedback_at: null,
        manager_id: null,
        ...payload,
        student_name: studentName,
        notes: payload.notes || '',
      }
      db.sessions.unshift(row)
      return row
    })
  },

  async addManagerFeedback(profileOrPayload, payload) {
    return withDb((db) => {
      const args = payload || profileOrPayload || {}
      const sessionId = args.sessionId
      const feedback = args.feedback
      const managerId = payload ? profileOrPayload?.id : args.managerId
      const session = db.sessions.find((s) => s.id === sessionId)
      if (!session) throw new Error('Session not found')
      const text = String(feedback || '').trim()
      if (!text) throw new Error('Feedback cannot be empty')

      session.manager_feedback = text
      session.manager_feedback_at = new Date().toISOString()
      session.manager_id = managerId

      const lesson = db.lessons.find((l) => l.id === session.lesson_id)
      const course = db.courses.find((c) => c.id === lesson?.course_id)
      const manager = db.profiles.find((p) => p.id === managerId)
      let label = 'a lesson'
      if (lesson) {
        label = `${course?.title || 'Course'} · Unit ${lesson.unit_number}`
      } else if (session.course_title) {
        label = session.unit_label ? `${session.course_title} · ${session.unit_label}` : session.course_title
      }
      const preview = text.length > 160 ? `${text.slice(0, 159).trim()}…` : text

      db.notifications.unshift({
        id: uid('ntf'),
        user_id: session.teacher_id,
        session_id: session.id,
        type: 'manager_feedback',
        title: 'New manager feedback',
        message: `${manager?.full_name || 'Manager'} left feedback on ${session.student_name}'s session (${label}): ${preview}`,
        read: false,
        created_at: new Date().toISOString(),
      })

      return session
    })
  },

  async listSessions(profile) {
    const db = read()
    let rows = db.sessions
    if (profile?.role === 'teacher') {
      rows = rows.filter((s) => s.teacher_id === profile.id)
    }
    return rows.map((s) => {
      const packLesson = db.lessons.find((l) => l.id === s.lesson_id)
      const packCourse = db.courses.find((c) => c.id === packLesson?.course_id)
      return {
        ...s,
        lesson:
          packLesson ||
          (s.unit_label || s.unit_number != null
            ? {
                theme: s.unit_label || 'Lesson',
                unit_number: s.unit_number,
                course: s.course_title ? { title: s.course_title } : null,
              }
            : null),
        teacher: db.profiles.find((p) => p.id === s.teacher_id),
        manager: db.profiles.find((p) => p.id === s.manager_id),
        course: packCourse || (s.course_title ? { title: s.course_title } : null),
      }
    })
  },

  async hoursSummary({ from, to } = {}) {
    const db = read()
    const teachers = db.profiles.filter((p) => p.role === 'teacher')
    const start = from ? new Date(`${from}T00:00:00`) : null
    const end = to ? new Date(`${to}T23:59:59`) : null
    const inRange = (s) => {
      if (s.hours == null || s.hours === '') return false
      const d = new Date(s.session_date || s.created_at)
      if (start && d < start) return false
      if (end && d > end) return false
      return true
    }
    const rows = teachers.map((teacher) => {
      const sessions = db.sessions.filter((s) => s.teacher_id === teacher.id && inRange(s))
      return {
        teacher_id: teacher.id,
        teacher,
        session_count: sessions.length,
        total_hours: sessions.reduce((sum, s) => sum + Number(s.hours || 0), 0),
      }
    })
    return {
      from: from || null,
      to: to || null,
      teachers: rows,
      total_hours: rows.reduce((sum, r) => sum + r.total_hours, 0),
      session_count: rows.reduce((sum, r) => sum + r.session_count, 0),
    }
  },

  async listNotifications(profileOrId) {
    const db = read()
    const userId = typeof profileOrId === 'string' ? profileOrId : profileOrId?.id
    return (db.notifications || [])
      .filter((n) => n.user_id === userId)
      .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
  },

  async markNotificationRead(profile, notificationId) {
    return withDb((db) => {
      const userId = typeof profile === 'string' ? profile : profile?.id
      const note = (db.notifications || []).find(
        (n) => n.id === notificationId && n.user_id === userId,
      )
      if (!note) throw new Error('Notification not found')
      note.read = true
      return note
    })
  },

  async markAllNotificationsRead(profile) {
    return withDb((db) => {
      const userId = typeof profile === 'string' ? profile : profile?.id
      for (const note of db.notifications || []) {
        if (note.user_id === userId) note.read = true
      }
      return true
    })
  },

  async listParents() {
    throw new Error('Kinz Family parents require the FastAPI backend')
  },
  async createParent() {
    throw new Error('Kinz Family parents require the FastAPI backend')
  },
  async updateParent() {
    throw new Error('Kinz Family parents require the FastAPI backend')
  },
  async deleteParent() {
    throw new Error('Kinz Family parents require the FastAPI backend')
  },
  async linkParentStudent() {
    throw new Error('Kinz Family parents require the FastAPI backend')
  },
  async unlinkParentStudent() {
    throw new Error('Kinz Family parents require the FastAPI backend')
  },
  async grantParentCredits() {
    throw new Error('Kinz Family parents require the FastAPI backend')
  },
  async listPayments() {
    throw new Error('Kinz Family payments require the FastAPI backend')
  },
  async confirmPayment() {
    throw new Error('Kinz Family payments require the FastAPI backend')
  },
  async grantComplimentary() {
    throw new Error('Kinz Family payments require the FastAPI backend')
  },
  async listPrizeRequests() {
    throw new Error('Kinz Family prizes require the FastAPI backend')
  },
  async fulfillPrizeRequest() {
    throw new Error('Kinz Family prizes require the FastAPI backend')
  },
  async setParentSpotlight() {
    throw new Error('Kinz Family hall requires the FastAPI backend')
  },
}
