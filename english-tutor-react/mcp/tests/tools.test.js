import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { TOOL_NAMES, createToolHandlers } from '../src/tools.js'

describe('createToolHandlers', () => {
  it('exposes the read-only Kinz tools', () => {
    const handlers = createToolHandlers({ get: async () => ({}) })
    assert.deepEqual(Object.keys(handlers).sort(), [...TOOL_NAMES].sort())
  })

  it('kinz_list_sessions GETs /api/sessions and paginates', async () => {
    const calls = []
    const handlers = createToolHandlers({
      get: async (path) => {
        calls.push(path)
        return [{ id: 'a', student_name: 'Sara' }, { id: 'b', student_name: 'Omar' }]
      },
    })
    const result = await handlers.kinz_list_sessions({ limit: 1, offset: 1, response_format: 'json' })
    assert.deepEqual(calls, ['/api/sessions'])
    assert.equal(result.isError, undefined)
    assert.equal(result.structuredContent.total, 2)
    assert.equal(result.structuredContent.items[0].student_name, 'Omar')
  })

  it('returns isError when the API forbids operations from listing students', async () => {
    const handlers = createToolHandlers({
      get: async () => {
        const err = new Error('Error: Teacher or manager access required. operations cannot list students.')
        throw err
      },
    })
    const result = await handlers.kinz_list_students({})
    assert.equal(result.isError, true)
    assert.match(result.content[0].text, /operations/i)
  })
})
