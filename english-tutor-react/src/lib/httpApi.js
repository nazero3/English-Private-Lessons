const TOKEN_KEY = 'lesson_sheets_token'

function baseUrl() {
  const raw = import.meta.env.VITE_API_URL
  if (raw === undefined || raw === null || raw === '') return ''
  return String(raw).replace(/\/$/, '')
}

function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${baseUrl()}${path}`, {
    ...options,
    headers,
  })

  let data = null
  const text = await res.text()
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = { detail: text }
    }
  }

  if (!res.ok) {
    const msg = data?.detail || data?.message || res.statusText || 'Request failed'
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg))
  }
  return data
}

export const httpApi = {
  isLocalMode: false,
  isSupabaseConfigured: false,
  isHttpMode: true,

  async getSession() {
    if (!getToken()) return { user: null, profile: null }
    try {
      return await request('/api/auth/me')
    } catch {
      setToken(null)
      return { user: null, profile: null }
    }
  },

  onAuthStateChange(callback) {
    return { data: { subscription: { unsubscribe() {} } } }
  },

  async signIn(email, password) {
    const data = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    setToken(data.access_token)
    return { user: data.user, profile: data.profile }
  },

  async signOut() {
    setToken(null)
    try {
      await request('/api/auth/logout', { method: 'POST' })
    } catch {
      /* ignore */
    }
  },

  async listProfiles() {
    return request('/api/profiles')
  },

  async updateProfileRole(profileId, role) {
    return request(`/api/profiles/${profileId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    })
  },

  async createTeacher(payload) {
    return request('/api/teachers', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  async updateTeacher(teacherId, payload) {
    return request(`/api/teachers/${teacherId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  },

  async deleteTeacher(teacherId) {
    return request(`/api/teachers/${teacherId}`, { method: 'DELETE' })
  },

  async createOperations(payload) {
    return request('/api/operations', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  async updateOperations(opsId, payload) {
    return request(`/api/operations/${opsId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  },

  async deleteOperations(opsId) {
    return request(`/api/operations/${opsId}`, { method: 'DELETE' })
  },

  async listCourses(profile) {
    return request('/api/courses')
  },

  async listLessons(courseId) {
    return request(`/api/courses/${courseId}/lessons`)
  },

  async getLesson(lessonId) {
    return request(`/api/lessons/${lessonId}`)
  },

  async getLessonsByUnits(courseId, unitNumbers) {
    const lessons = await this.listLessons(courseId)
    return lessons.filter((l) => unitNumbers.includes(l.unit_number))
  },

  async getReviewQuiz(lessonId) {
    return request(`/api/lessons/${lessonId}/review-quiz`)
  },

  async gradeReviewQuiz(lessonId, answers) {
    return request(`/api/lessons/${lessonId}/review-quiz/grade`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    })
  },

  async updateLesson(lessonId, patch) {
    return request(`/api/lessons/${lessonId}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    })
  },

  async listAssignments() {
    return request('/api/assignments')
  },

  async setAssignment(teacherId, courseId, assigned) {
    return request('/api/assignments', {
      method: 'PUT',
      body: JSON.stringify({ teacher_id: teacherId, course_id: courseId, assigned }),
    })
  },

  async setPrivateLessonsAccess(teacherId, enabled) {
    return request(`/api/teachers/${teacherId}/private-lessons`, {
      method: 'PATCH',
      body: JSON.stringify({ enabled }),
    })
  },

  async setMathGrade9Access(teacherId, enabled) {
    return request(`/api/teachers/${teacherId}/math-grade9`, {
      method: 'PATCH',
      body: JSON.stringify({ enabled }),
    })
  },

  async setMathGrade12Access(teacherId, enabled) {
    return request(`/api/teachers/${teacherId}/math-grade12`, {
      method: 'PATCH',
      body: JSON.stringify({ enabled }),
    })
  },

  async setPhysicsGrade12Access(teacherId, enabled) {
    return request(`/api/teachers/${teacherId}/physics-grade12`, {
      method: 'PATCH',
      body: JSON.stringify({ enabled }),
    })
  },

  async createSession(payload) {
    return request('/api/sessions', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  async updateSession(sessionId, payload) {
    return request(`/api/sessions/${sessionId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  },

  async deleteSession(sessionId) {
    return request(`/api/sessions/${sessionId}`, { method: 'DELETE' })
  },

  async listStudents(profile) {
    return request('/api/students')
  },

  async createStudent(profile, payload) {
    const body =
      typeof payload === 'string' ? { full_name: payload } : { full_name: payload?.full_name, ...payload }
    return request('/api/students', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },

  async getStudent(studentId) {
    return request(`/api/students/${studentId}`)
  },

  async updateStudent(studentId, payload) {
    return request(`/api/students/${studentId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  },

  async deleteStudent(studentId) {
    return request(`/api/students/${studentId}`, { method: 'DELETE' })
  },

  async getMyStudentPortal() {
    return request('/api/me/student')
  },

  async addStudentScore(studentId, payload) {
    return request(`/api/students/${studentId}/scores`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  async updateStudentScore(studentId, scoreId, payload) {
    return request(`/api/students/${studentId}/scores/${scoreId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  },

  async deleteStudentScore(studentId, scoreId) {
    return request(`/api/students/${studentId}/scores/${scoreId}`, { method: 'DELETE' })
  },

  async addManagerFeedback(profile, { sessionId, feedback }) {
    return request(`/api/sessions/${sessionId}/feedback`, {
      method: 'POST',
      body: JSON.stringify({ feedback }),
    })
  },

  async listSessions(profile) {
    return request('/api/sessions')
  },

  async hoursSummary({ from, to } = {}) {
    const params = new URLSearchParams()
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    const q = params.toString()
    return request(`/api/hours/summary${q ? `?${q}` : ''}`)
  },

  async listNotifications(profile) {
    return request('/api/notifications')
  },

  async markNotificationRead(profile, notificationId) {
    return request(`/api/notifications/${notificationId}/read`, { method: 'PATCH' })
  },

  async markAllNotificationsRead(profile) {
    return request('/api/notifications/read-all', { method: 'POST' })
  },

  async listParents() {
    return request('/api/parents')
  },

  async createParent(payload) {
    return request('/api/parents', { method: 'POST', body: JSON.stringify(payload) })
  },

  async getParent(parentId) {
    return request(`/api/parents/${parentId}`)
  },

  async updateParent(parentId, payload) {
    return request(`/api/parents/${parentId}`, { method: 'PATCH', body: JSON.stringify(payload) })
  },

  async linkParentStudent(parentId, payload) {
    return request(`/api/parents/${parentId}/students`, { method: 'POST', body: JSON.stringify(payload) })
  },

  async unlinkParentStudent(parentId, studentId) {
    return request(`/api/parents/${parentId}/students/${studentId}`, { method: 'DELETE' })
  },

  async grantParentCredits(parentId, payload) {
    return request(`/api/parents/${parentId}/credits`, { method: 'POST', body: JSON.stringify(payload) })
  },

  async listPayments() {
    return request('/api/payments')
  },

  async confirmPayment(paymentId) {
    return request(`/api/payments/${paymentId}/confirm`, { method: 'POST' })
  },

  async grantComplimentary(parentId, payload) {
    return request(`/api/parents/${parentId}/complimentary`, { method: 'POST', body: JSON.stringify(payload) })
  },

  async listPrizeRequests() {
    return request('/api/prize-requests')
  },

  async fulfillPrizeRequest(redemptionId) {
    return request(`/api/prize-requests/${redemptionId}/fulfill`, { method: 'POST' })
  },

  async setParentSpotlight(parentId, payload) {
    return request(`/api/parents/${parentId}/spotlight`, { method: 'POST', body: JSON.stringify(payload) })
  },
}
