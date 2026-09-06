import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { KinzApiError, createKinzClient } from '../src/client.js'

function mockFetch(handlers) {
  return async (url, init = {}) => {
    const method = (init.method || 'GET').toUpperCase()
    const key = `${method} ${new URL(url, 'http://127.0.0.1:8000').pathname}`
    const handler = handlers[key]
    if (!handler) {
      return { ok: false, status: 404, json: async () => ({ detail: `no mock for ${key}` }) }
    }
    return handler(init, url)
  }
}

describe('createKinzClient', () => {
  it('logs in then GETs with bearer token', async () => {
    const calls = []
    const fetchImpl = mockFetch({
      'POST /api/auth/login': async (init) => {
        calls.push(['login', JSON.parse(init.body)])
        return { ok: true, status: 200, json: async () => ({ access_token: 'tok-1' }) }
      },
      'GET /api/health': async (init) => {
        calls.push(['health', init.headers.Authorization])
        return { ok: true, status: 200, json: async () => ({ status: 'ok' }) }
      },
    })
    const client = createKinzClient({
      apiUrl: 'http://127.0.0.1:8000',
      email: 'ops@lesson-sheets.app',
      password: 'changeme',
      fetchImpl,
    })
    const health = await client.get('/api/health')
    assert.deepEqual(health, { status: 'ok' })
    assert.deepEqual(calls[0], ['login', { email: 'ops@lesson-sheets.app', password: 'changeme' }])
    assert.equal(calls[1][1], 'Bearer tok-1')
  })

  it('uses an existing token without logging in', async () => {
    let loggedIn = false
    const fetchImpl = mockFetch({
      'POST /api/auth/login': async () => {
        loggedIn = true
        return { ok: true, status: 200, json: async () => ({ access_token: 'nope' }) }
      },
      'GET /api/auth/me': async (init) => {
        assert.equal(init.headers.Authorization, 'Bearer preset')
        return {
          ok: true,
          status: 200,
          json: async () => ({ profile: { role: 'operations' } }),
        }
      },
    })
    const client = createKinzClient({
      apiUrl: 'http://127.0.0.1:8000',
      token: 'preset',
      fetchImpl,
    })
    const me = await client.get('/api/auth/me')
    assert.equal(me.profile.role, 'operations')
    assert.equal(loggedIn, false)
  })

  it('never exposes POST/PATCH/DELETE helpers', () => {
    const client = createKinzClient({ apiUrl: 'http://127.0.0.1:8000', token: 'x', fetchImpl: async () => {} })
    assert.equal(typeof client.get, 'function')
    assert.equal(client.post, undefined)
    assert.equal(client.patch, undefined)
    assert.equal(client.delete, undefined)
  })

  it('turns 403 into an actionable error for operations vs staff routes', async () => {
    const fetchImpl = mockFetch({
      'GET /api/students': async () => ({
        ok: false,
        status: 403,
        json: async () => ({ detail: 'Teacher or manager access required' }),
      }),
    })
    const client = createKinzClient({
      apiUrl: 'http://127.0.0.1:8000',
      token: 'ops-token',
      fetchImpl,
    })
    await assert.rejects(
      () => client.get('/api/students'),
      (err) => {
        assert.ok(err instanceof KinzApiError)
        assert.equal(err.status, 403)
        assert.match(err.message, /teacher or manager/i)
        assert.match(err.message, /operations/i)
        return true
      },
    )
  })

  it('explains connection failures as start-the-local-API', async () => {
    const fetchImpl = async () => {
      throw new Error('fetch failed')
    }
    const client = createKinzClient({
      apiUrl: 'http://127.0.0.1:8000',
      token: 'x',
      fetchImpl,
    })
    await assert.rejects(() => client.get('/api/health'), /localhost:8000|local API/i)
  })
})
