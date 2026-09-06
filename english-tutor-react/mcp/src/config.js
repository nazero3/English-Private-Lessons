export const DEFAULT_API_URL = 'http://127.0.0.1:8000'

function isLocalHost(hostname) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1'
}

function isProductionHost(hostname) {
  return hostname === 'kinz-teach.cloud' || hostname.endsWith('.kinz-teach.cloud')
}

export function resolveConfig(env = process.env) {
  const raw = (env.KINZ_API_URL || DEFAULT_API_URL).trim()
  let parsed
  try {
    parsed = new URL(raw)
  } catch {
    throw new Error(`KINZ_API_URL is not a valid URL: ${raw}`)
  }

  const apiUrl = parsed.origin

  if (isProductionHost(parsed.hostname) && env.KINZ_ALLOW_PRODUCTION !== 'true') {
    throw new Error(
      `Refusing production API ${apiUrl}. This MCP sidecar defaults to localhost so https://kinz-teach.cloud is not touched. Set KINZ_ALLOW_PRODUCTION=true only if you intentionally want read-only production calls.`,
    )
  }

  if (!isLocalHost(parsed.hostname) && !isProductionHost(parsed.hostname) && env.KINZ_ALLOW_REMOTE !== 'true') {
    throw new Error(
      `Refusing non-local API ${apiUrl}. For a staging host set KINZ_ALLOW_REMOTE=true.`,
    )
  }

  const token = (env.KINZ_TOKEN || '').trim() || null
  const email = (env.KINZ_EMAIL || '').trim() || null
  const password = env.KINZ_PASSWORD ? String(env.KINZ_PASSWORD) : null
  if (!token && (!email || !password)) {
    throw new Error(
      'Set KINZ_TOKEN, or both KINZ_EMAIL and KINZ_PASSWORD. Local demo: ops@lesson-sheets.app / changeme (sessions + hours). Use manager@lesson-sheets.app for students, payments, and prize requests.',
    )
  }

  return { apiUrl, token, email, password }
}
