import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { DEFAULT_API_URL, resolveConfig } from '../src/config.js'

describe('resolveConfig', () => {
  it('defaults to local FastAPI and refuses production', () => {
    const cfg = resolveConfig({ KINZ_TOKEN: 'dev' })
    assert.equal(cfg.apiUrl, DEFAULT_API_URL)
    assert.equal(cfg.apiUrl, 'http://127.0.0.1:8000')
  })

  it('accepts localhost and 127.0.0.1', () => {
    assert.equal(
      resolveConfig({ KINZ_API_URL: 'http://localhost:8000', KINZ_TOKEN: 'dev' }).apiUrl,
      'http://localhost:8000',
    )
    assert.equal(
      resolveConfig({ KINZ_API_URL: 'http://127.0.0.1:8000', KINZ_TOKEN: 'dev' }).apiUrl,
      'http://127.0.0.1:8000',
    )
  })

  it('refuses kinz-teach.cloud unless KINZ_ALLOW_PRODUCTION=true', () => {
    assert.throws(
      () => resolveConfig({ KINZ_API_URL: 'https://kinz-teach.cloud', KINZ_TOKEN: 'dev' }),
      /production|kinz-teach\.cloud/i,
    )
    assert.throws(
      () =>
        resolveConfig({
          KINZ_API_URL: 'https://kinz-teach.cloud/api',
          KINZ_ALLOW_REMOTE: 'true',
          KINZ_TOKEN: 'dev',
        }),
      /KINZ_ALLOW_PRODUCTION/,
    )
    const allowed = resolveConfig({
      KINZ_API_URL: 'https://kinz-teach.cloud',
      KINZ_ALLOW_PRODUCTION: 'true',
      KINZ_TOKEN: 'dev',
    })
    assert.equal(allowed.apiUrl, 'https://kinz-teach.cloud')
  })

  it('refuses other remote hosts unless KINZ_ALLOW_REMOTE=true', () => {
    assert.throws(
      () => resolveConfig({ KINZ_API_URL: 'https://staging.example.com', KINZ_TOKEN: 'dev' }),
      /KINZ_ALLOW_REMOTE/,
    )
    const allowed = resolveConfig({
      KINZ_API_URL: 'https://staging.example.com',
      KINZ_ALLOW_REMOTE: 'true',
      KINZ_TOKEN: 'dev',
    })
    assert.equal(allowed.apiUrl, 'https://staging.example.com')
  })

  it('requires email+password or a token', () => {
    assert.throws(() => resolveConfig({}), /KINZ_EMAIL|KINZ_TOKEN/)
    const withToken = resolveConfig({ KINZ_TOKEN: 'abc' })
    assert.equal(withToken.token, 'abc')
    const withLogin = resolveConfig({ KINZ_EMAIL: 'ops@lesson-sheets.app', KINZ_PASSWORD: 'changeme' })
    assert.equal(withLogin.email, 'ops@lesson-sheets.app')
  })
})
