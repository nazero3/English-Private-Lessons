import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { paginate, toToolText } from '../src/format.js'

describe('paginate', () => {
  it('slices arrays with default limit 20 and max 50', () => {
    const items = Array.from({ length: 80 }, (_, i) => i)
    const first = paginate(items, {})
    assert.equal(first.items.length, 20)
    assert.equal(first.total, 80)
    assert.equal(first.offset, 0)
    assert.equal(first.limit, 20)
    assert.equal(first.has_more, true)
    assert.equal(first.next_offset, 20)

    const capped = paginate(items, { limit: 200, offset: 70 })
    assert.equal(capped.items.length, 10)
    assert.equal(capped.limit, 50)
    assert.equal(capped.has_more, false)
    assert.equal(capped.next_offset, null)
  })

  it('passes objects through without inventing an array', () => {
    const payload = { status: 'ok' }
    const page = paginate(payload, { limit: 5 })
    assert.deepEqual(page.items, payload)
    assert.equal(page.total, 1)
    assert.equal(page.has_more, false)
  })
})

describe('toToolText', () => {
  it('returns json or compact markdown', () => {
    const page = paginate([{ id: '1', full_name: 'Sara' }], { limit: 5 })
    const json = JSON.parse(toToolText(page, 'json'))
    assert.equal(json.total, 1)
    const md = toToolText(page, 'markdown')
    assert.match(md, /Sara/)
    assert.match(md, /total: 1/i)
  })
})
