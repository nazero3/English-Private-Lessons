export const DEFAULT_LIMIT = 20
export const MAX_LIMIT = 50

export function paginate(payload, { limit, offset } = {}) {
  const safeLimit = Math.min(MAX_LIMIT, Math.max(1, Number(limit) || DEFAULT_LIMIT))
  const safeOffset = Math.max(0, Number(offset) || 0)

  if (!Array.isArray(payload)) {
    return {
      items: payload,
      total: 1,
      offset: 0,
      limit: safeLimit,
      has_more: false,
      next_offset: null,
    }
  }

  const items = payload.slice(safeOffset, safeOffset + safeLimit)
  const has_more = safeOffset + items.length < payload.length
  return {
    items,
    total: payload.length,
    offset: safeOffset,
    limit: safeLimit,
    has_more,
    next_offset: has_more ? safeOffset + items.length : null,
  }
}

function label(row) {
  if (row == null || typeof row !== 'object') return String(row)
  return (
    row.full_name ||
    row.student_name ||
    row.display_name ||
    row.teacher?.full_name ||
    row.status ||
    row.id ||
    'item'
  )
}

export function toToolText(page, format = 'markdown') {
  if (format === 'json') return JSON.stringify(page, null, 2)
  const { items, total, offset, limit, has_more } = page
  const rows = Array.isArray(items) ? items : [items]
  const lines = [
    `total: ${total}`,
    `showing: ${rows.length} (offset ${offset}, limit ${limit})`,
    `has_more: ${has_more}`,
    '',
  ]
  for (const row of rows) {
    lines.push(`- ${label(row)}`)
  }
  return lines.join('\n')
}
