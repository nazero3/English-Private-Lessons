import { TOKEN_KEY } from './format'

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

  const res = await fetch(`${baseUrl()}${path}`, { ...options, headers })
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
    const msg = data?.detail || data?.message || res.statusText || 'تعذّر الاتصال'
    const err = new Error(typeof msg === 'string' ? msg : JSON.stringify(msg))
    err.status = res.status
    throw err
  }
  return data
}

export const api = {
  getToken,
  setToken,

  async getLuminate() {
    return request('/api/public/luminate')
  },

  async getSession() {
    if (!getToken()) return { user: null, profile: null }
    try {
      return await request('/api/auth/me')
    } catch {
      setToken(null)
      return { user: null, profile: null }
    }
  },

  async parentLogin({ phone, family_code, pin }) {
    const data = await request('/api/auth/parent-login', {
      method: 'POST',
      body: JSON.stringify({ phone: phone || null, family_code: family_code || null, pin }),
    })
    setToken(data.access_token)
    return data
  },

  async signOut() {
    setToken(null)
    try {
      await request('/api/auth/logout', { method: 'POST' })
    } catch {
      /* ignore */
    }
  },

  async getFamily() {
    return request('/api/me/family')
  },

  async getChild(studentId) {
    return request(`/api/me/family/children/${studentId}`)
  },

  async changePin(pin) {
    return request('/api/me/family/pin', { method: 'POST', body: JSON.stringify({ pin }) })
  },

  async setSpotlight(payload) {
    return request('/api/me/family/spotlight', { method: 'POST', body: JSON.stringify(payload) })
  },

  async redeemPrize(prizeId) {
    return request(`/api/me/family/prizes/${prizeId}/redeem`, { method: 'POST' })
  },

  async createPayIntent(payload) {
    return request('/api/me/family/pay-intent', { method: 'POST', body: JSON.stringify(payload) })
  },
}
