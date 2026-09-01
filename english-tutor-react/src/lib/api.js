import { httpApi } from './httpApi'
import { localApi } from './localApi'
import { isSupabaseConfigured, supabase } from './supabase'

const apiUrl = import.meta.env.VITE_API_URL
const useFastApi = import.meta.env.VITE_USE_FASTAPI === 'true'
export const isHttpMode =
  useFastApi || Boolean(apiUrl && !String(apiUrl).includes('YOUR_'))
export const isLocalMode = !isHttpMode && !isSupabaseConfigured

async function requireProfile() {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) throw new Error('Not signed in')
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', auth.user.id)
    .single()
  if (error) throw error
  return { user: auth.user, profile }
}

const supabaseApi = {
  isLocalMode: false,
  isSupabaseConfigured: true,
  isHttpMode: false,

  async getSession() {
    const { data } = await supabase.auth.getSession()
    if (!data.session) return { user: null, profile: null }
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.session.user.id)
      .single()
    return {
      user: { id: data.session.user.id, email: data.session.user.email },
      profile,
    }
  },

  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(() => {
      callback()
    })
  },

  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()
    return { user: { id: data.user.id, email: data.user.email }, profile }
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  async listProfiles() {
    const { data, error } = await supabase.from('profiles').select('*').order('full_name')
    if (error) throw error
    return data
  },

  async updateProfileRole(profileId, role) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', profileId)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async createTeacher({ email, password, full_name }) {
    throw new Error(
      'Teacher accounts are created in your authentication provider. After they sign in, assign curriculum in the Access tab.',
    )
  },

  async updateTeacher(teacherId, { email, password, full_name }) {
    const patch = { full_name: String(full_name || '').trim() }
    if (!patch.full_name) throw new Error('Name is required')
    const { data, error } = await supabase
      .from('profiles')
      .update(patch)
      .eq('id', teacherId)
      .eq('role', 'teacher')
      .select()
      .single()
    if (error) throw error
    if (email || password) {
      throw new Error(
        'Name updated. Contact your administrator to change login email or password.',
      )
    }
    return data
  },

  async deleteTeacher(teacherId) {
    throw new Error(
      'Teacher accounts are removed in your authentication provider. Refresh this page after removal.',
    )
  },

  async listCourses(profile) {
    const { data, error } = await supabase.from('courses').select('*').order('grade')
    if (error) throw error
    return data
  },

  async listLessons(courseId) {
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('course_id', courseId)
      .order('unit_number')
    if (error) throw error
    return data
  },

  async getLesson(lessonId) {
    const { data, error } = await supabase
      .from('lessons')
      .select('*, course:courses(*)')
      .eq('id', lessonId)
      .single()
    if (error) throw error
    return { ...data, course: data.course }
  },

  async getLessonsByUnits(courseId, unitNumbers) {
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('course_id', courseId)
      .in('unit_number', unitNumbers)
      .order('unit_number')
    if (error) throw error
    return data
  },

  async getReviewQuiz(lessonId) {
    const { data, error } = await supabase.rpc('get_review_quiz', { p_lesson_id: lessonId })
    if (error) throw error
    const lesson = await this.getLesson(lessonId)
    return {
      lessonId: data.lessonId ?? lessonId,
      courseId: data.courseId ?? lesson.course_id,
      unitNumber: data.unitNumber ?? lesson.unit_number,
      units: data.units || [],
      items: data.items || [],
      lessonsMeta: data.lessonsMeta || [],
      course: lesson.course,
    }
  },

  async gradeReviewQuiz(lessonId, answers) {
    const { data, error } = await supabase.rpc('grade_review_quiz', {
      p_lesson_id: lessonId,
      p_answers: answers,
    })
    if (error) throw error
    return data
  },

  async updateLesson(lessonId, patch) {
    const { data, error } = await supabase
      .from('lessons')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', lessonId)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async listAssignments() {
    const { data, error } = await supabase
      .from('teacher_course_assignments')
      .select('*, teacher:profiles(*), course:courses(*)')
    if (error) throw error
    return data.map((a) => ({
      ...a,
      teacher: a.teacher,
      course: a.course,
    }))
  },

  async setAssignment(teacherId, courseId, assigned) {
    if (assigned) {
      const { error } = await supabase
        .from('teacher_course_assignments')
        .upsert({ teacher_id: teacherId, course_id: courseId }, { onConflict: 'teacher_id,course_id' })
      if (error) throw error
    } else {
      const { error } = await supabase
        .from('teacher_course_assignments')
        .delete()
        .eq('teacher_id', teacherId)
        .eq('course_id', courseId)
      if (error) throw error
    }
  },

  async setPrivateLessonsAccess(teacherId, enabled) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ can_access_private_lessons: Boolean(enabled) })
      .eq('id', teacherId)
      .eq('role', 'teacher')
      .select()
      .single()
    if (error) throw error
    return data
  },

  async setMathGrade9Access(teacherId, enabled) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ can_access_math_grade9: Boolean(enabled) })
      .eq('id', teacherId)
      .eq('role', 'teacher')
      .select()
      .single()
    if (error) throw error
    return data
  },

  async setMathGrade12Access(teacherId, enabled) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ can_access_math_grade12: Boolean(enabled) })
      .eq('id', teacherId)
      .eq('role', 'teacher')
      .select()
      .single()
    if (error) throw error
    return data
  },

  async setPhysicsGrade12Access(teacherId, enabled) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ can_access_physics_grade12: Boolean(enabled) })
      .eq('id', teacherId)
      .eq('role', 'teacher')
      .select()
      .single()
    if (error) throw error
    return data
  },

  async createSession(payload) {
    const { user } = await requireProfile()
    const { data, error } = await supabase
      .from('lesson_sessions')
      .insert({ ...payload, teacher_id: user.id })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async listStudents(profile) {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('teacher_id', profile.id)
      .order('full_name')
    if (error) throw error
    return data
  },

  async createStudent(profile, full_name) {
    const { data, error } = await supabase
      .from('students')
      .insert({ teacher_id: profile.id, full_name: String(full_name || '').trim() })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async addManagerFeedback(profile, { sessionId, feedback }) {
    const text = String(feedback || '').trim()
    if (!text) throw new Error('Feedback cannot be empty')
    const { data: session, error } = await supabase
      .from('lesson_sessions')
      .update({
        manager_feedback: text,
        manager_feedback_at: new Date().toISOString(),
        manager_id: profile.id,
      })
      .eq('id', sessionId)
      .select('*, lesson:lessons(*, course:courses(*)), teacher:profiles(*)')
      .single()
    if (error) throw error

    const label = session.lesson
      ? `${session.lesson.course?.title || 'Course'} · Unit ${session.lesson.unit_number}`
      : 'a lesson'
    await supabase.from('notifications').insert({
      user_id: session.teacher_id,
      session_id: session.id,
      type: 'manager_feedback',
      title: 'New manager feedback',
      message: `${profile.full_name || 'Manager'} left feedback on ${session.student_name}'s session (${label}).`,
    })
    return session
  },

  async getMyStudentPortal() {
    throw new Error('Student portal requires the FastAPI backend')
  },

  async getStudent() {
    throw new Error('Student profiles require the FastAPI backend')
  },

  async updateStudent() {
    throw new Error('Student profiles require the FastAPI backend')
  },

  async deleteStudent() {
    throw new Error('Student profiles require the FastAPI backend')
  },

  async addStudentScore() {
    throw new Error('Student scores require the FastAPI backend')
  },

  async updateStudentScore() {
    throw new Error('Student scores require the FastAPI backend')
  },

  async deleteStudentScore() {
    throw new Error('Student scores require the FastAPI backend')
  },

  async updateSession() {
    throw new Error('Editing sessions requires the FastAPI backend')
  },

  async deleteSession() {
    throw new Error('Deleting sessions requires the FastAPI backend')
  },

  async listSessions(profile) {
    const { data, error } = await supabase
      .from('lesson_sessions')
      .select('*, lesson:lessons(*, course:courses(*)), teacher:profiles(*), manager:profiles!lesson_sessions_manager_id_fkey(*)')
      .order('session_date', { ascending: false })
    if (error) throw error
    return data.map((s) => ({
      ...s,
      lesson: s.lesson,
      teacher: s.teacher,
      manager: s.manager,
      course: s.lesson?.course,
    }))
  },

  async listNotifications(profile) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  async markNotificationRead(profile, notificationId) {
    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .eq('user_id', profile.id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async markAllNotificationsRead(profile) {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', profile.id)
      .eq('read', false)
    if (error) throw error
    return true
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

export const api = isHttpMode ? httpApi : isLocalMode ? localApi : supabaseApi
