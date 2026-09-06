import { paginate, toToolText } from './format.js'

const LIST_DEFAULTS = { limit: 20, offset: 0, response_format: 'markdown' }

function listArgs(args = {}) {
  return {
    limit: args.limit ?? LIST_DEFAULTS.limit,
    offset: args.offset ?? LIST_DEFAULTS.offset,
    response_format: args.response_format ?? LIST_DEFAULTS.response_format,
  }
}

function ok(page, format) {
  const text = toToolText(page, format)
  return {
    content: [{ type: 'text', text }],
    structuredContent: page,
  }
}

function fail(err) {
  return {
    isError: true,
    content: [{ type: 'text', text: err.message || String(err) }],
  }
}

export function createToolHandlers(client) {
  return {
    async kinz_health() {
      try {
        const data = await client.get('/api/health')
        return ok(paginate(data), 'json')
      } catch (err) {
        return fail(err)
      }
    },

    async kinz_whoami() {
      try {
        const data = await client.get('/api/auth/me')
        return ok(paginate(data), 'json')
      } catch (err) {
        return fail(err)
      }
    },

    async kinz_list_sessions(args) {
      try {
        const { limit, offset, response_format } = listArgs(args)
        const data = await client.get('/api/sessions')
        return ok(paginate(data, { limit, offset }), response_format)
      } catch (err) {
        return fail(err)
      }
    },

    async kinz_hours_summary(args = {}) {
      try {
        const query = {}
        if (args.from) query.from = args.from
        if (args.to) query.to = args.to
        const data = await client.get('/api/hours/summary', query)
        return ok(paginate(data), args.response_format || 'json')
      } catch (err) {
        return fail(err)
      }
    },

    async kinz_list_students(args) {
      try {
        const { limit, offset, response_format } = listArgs(args)
        const data = await client.get('/api/students')
        return ok(paginate(data, { limit, offset }), response_format)
      } catch (err) {
        return fail(err)
      }
    },

    async kinz_list_payments(args) {
      try {
        const { limit, offset, response_format } = listArgs(args)
        const data = await client.get('/api/payments')
        return ok(paginate(data, { limit, offset }), response_format)
      } catch (err) {
        return fail(err)
      }
    },

    async kinz_list_prize_requests(args) {
      try {
        const { limit, offset, response_format } = listArgs(args)
        const data = await client.get('/api/prize-requests')
        return ok(paginate(data, { limit, offset }), response_format)
      } catch (err) {
        return fail(err)
      }
    },
  }
}

export const TOOL_NAMES = [
  'kinz_health',
  'kinz_whoami',
  'kinz_list_sessions',
  'kinz_hours_summary',
  'kinz_list_students',
  'kinz_list_payments',
  'kinz_list_prize_requests',
]
