export class KinzApiError extends Error {
  constructor(message, status = 0) {
    super(message)
    this.name = 'KinzApiError'
    this.status = status
  }
}

async function readJson(res) {
  if (typeof res.json === 'function') {
    try {
      return await res.json()
    } catch {
      return {}
    }
  }
  if (typeof res.text === 'function') {
    const text = await res.text()
    if (!text) return {}
    try {
      return JSON.parse(text)
    } catch {
      return { detail: text }
    }
  }
  return {}
}

function formatError(op, status, data) {
  const detail =
    typeof data?.detail === 'string'
      ? data.detail
      : data?.detail
        ? JSON.stringify(data.detail)
        : resBody(data)
  if (status === 403) {
    return `Error: ${detail} (${op} returned 403). Operations can read sessions and hours; student roster, payments, and prize requests need a teacher or manager account. Set KINZ_EMAIL to that role and retry.`
  }
  if (status === 401) {
    return `Error: Not signed in (${op}). Check KINZ_EMAIL / KINZ_PASSWORD or KINZ_TOKEN.`
  }
  return `Error: ${op} failed with ${status}: ${detail}`
}

function resBody(data) {
  if (data == null) return 'no body'
  if (typeof data === 'string') return data
  try {
    return JSON.stringify(data)
  } catch {
    return 'unreadable body'
  }
}

export function createKinzClient({ apiUrl, email, password, token, fetchImpl = fetch }) {
  let accessToken = token || null

  async function login() {
    let res
    try {
      res = await fetchImpl(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email, password }),
      })
    } catch (err) {
      throw new KinzApiError(
        `Cannot reach the local API at ${apiUrl}. Start FastAPI on localhost:8000, then retry. Original: ${err.message}`,
        0,
      )
    }
    const data = await readJson(res)
    if (!res.ok) {
      throw new KinzApiError(formatError('POST /api/auth/login', res.status, data), res.status)
    }
    accessToken = data.access_token
    if (!accessToken) {
      throw new KinzApiError('Login succeeded but no access_token was returned', 500)
    }
  }

  async function get(path, query) {
    try {
      if (!accessToken) await login()
      const url = new URL(path, `${apiUrl}/`)
      if (query) {
        for (const [key, value] of Object.entries(query)) {
          if (value != null && value !== '') url.searchParams.set(key, String(value))
        }
      }
      const headers = { Accept: 'application/json' }
      if (accessToken) headers.Authorization = `Bearer ${accessToken}`
      const res = await fetchImpl(url, { method: 'GET', headers })
      const data = await readJson(res)
      if (!res.ok) {
        throw new KinzApiError(formatError(`GET ${path}`, res.status, data), res.status)
      }
      return data
    } catch (err) {
      if (err instanceof KinzApiError) throw err
      throw new KinzApiError(
        `Cannot reach the local API at ${apiUrl}. Start FastAPI on localhost:8000 (uvicorn or docker compose), then retry. Original: ${err.message}`,
        0,
      )
    }
  }

  return { get }
}
