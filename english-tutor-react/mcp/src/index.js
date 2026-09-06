#!/usr/bin/env node
/**
 * Read-only Kinz MCP sidecar. Talks to a local FastAPI by default.
 * Does not modify the live app process or deploy path.
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import { createKinzClient } from './client.js'
import { resolveConfig } from './config.js'
import { createToolHandlers } from './tools.js'

const readOnly = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: true,
}

const listInput = {
  limit: z.number().int().min(1).max(50).optional().describe('Max items to return (default 20, max 50)'),
  offset: z.number().int().min(0).optional().describe('Items to skip for pagination'),
  response_format: z
    .enum(['markdown', 'json'])
    .optional()
    .describe("Output format: 'markdown' (default for lists) or 'json'"),
}

async function main() {
  const cfg = resolveConfig(process.env)
  const handlers = createToolHandlers(createKinzClient(cfg))
  const server = new McpServer({ name: 'kinz-mcp-server', version: '1.0.0' })

  server.registerTool(
    'kinz_health',
    {
      title: 'Kinz API health',
      description:
        'Check that the local Kinz Teacher Platform API is up (GET /api/health). Use before other tools. Does not change data.',
      annotations: readOnly,
    },
    () => handlers.kinz_health(),
  )

  server.registerTool(
    'kinz_whoami',
    {
      title: 'Kinz signed-in profile',
      description:
        'Return the signed-in Kinz user and role (GET /api/auth/me). Operations can read sessions/hours; students, payments, and prizes need teacher or manager.',
      annotations: readOnly,
    },
    () => handlers.kinz_whoami(),
  )

  server.registerTool(
    'kinz_list_sessions',
    {
      title: 'List Kinz class sessions',
      description: `List logged class sessions (GET /api/sessions). Teachers see their own; operations and managers see all. Read-only.

Args:
  - limit (number): 1-50, default 20
  - offset (number): skip this many rows
  - response_format ('markdown' | 'json')`,
      inputSchema: listInput,
      annotations: readOnly,
    },
    (args) => handlers.kinz_list_sessions(args),
  )

  server.registerTool(
    'kinz_hours_summary',
    {
      title: 'Teacher hours summary',
      description: `Hours and session counts per teacher for a date range (GET /api/hours/summary). Operations or manager only.

Args:
  - from (string): start date YYYY-MM-DD (default first day of this month)
  - to (string): end date YYYY-MM-DD (default end of that month)
  - response_format ('markdown' | 'json')`,
      inputSchema: {
        from: z.string().optional().describe('Start date YYYY-MM-DD'),
        to: z.string().optional().describe('End date YYYY-MM-DD'),
        response_format: z.enum(['markdown', 'json']).optional(),
      },
      annotations: readOnly,
    },
    (args) => handlers.kinz_hours_summary(args),
  )

  server.registerTool(
    'kinz_list_students',
    {
      title: 'List Kinz students',
      description: `List roster students (GET /api/students). Requires teacher or manager. Operations accounts receive 403 from the API.`,
      inputSchema: listInput,
      annotations: readOnly,
    },
    (args) => handlers.kinz_list_students(args),
  )

  server.registerTool(
    'kinz_list_payments',
    {
      title: 'List Kinz payment intents',
      description: `List family payment intents (GET /api/payments). Requires teacher or manager. Does not confirm payments.`,
      inputSchema: listInput,
      annotations: readOnly,
    },
    (args) => handlers.kinz_list_payments(args),
  )

  server.registerTool(
    'kinz_list_prize_requests',
    {
      title: 'List Kinz prize requests',
      description: `List prize redemptions waiting for staff (GET /api/prize-requests). Requires teacher or manager. Does not fulfill prizes.`,
      inputSchema: listInput,
      annotations: readOnly,
    },
    (args) => handlers.kinz_list_prize_requests(args),
  )

  const transport = new StdioServerTransport()
  await server.connect(transport)
}

main().catch((err) => {
  console.error(err.message || err)
  process.exit(1)
})
