/**
 * Emits supabase/seed.sql from enriched lessons.
 * Run after enrichLessons.mjs
 */
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ENRICHED_LESSONS } from '../src/data/enrichedLessons.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

function esc(str) {
  return String(str ?? '').replaceAll("'", "''")
}

function jsonb(value) {
  return `'${esc(JSON.stringify(value))}'::jsonb`
}

const lines = []
lines.push('-- Seed courses + lessons. Run after schema.sql')
lines.push("-- Create manager user in Auth UI first, then: update profiles set role = 'manager' where id = '<uuid>';")
lines.push('')
lines.push(`insert into public.courses (id, code, title, grade) values
  ('11111111-1111-1111-1111-111111111111', 'grade_9', 'Grade 9 English', '9'),
  ('22222222-2222-2222-2222-222222222222', 'grade_12', 'Grade 12 English', '12')
on conflict (code) do update set title = excluded.title, grade = excluded.grade;`)
lines.push('')

const courseIds = { '9': '11111111-1111-1111-1111-111111111111', '12': '22222222-2222-2222-2222-222222222222' }

for (const l of ENRICHED_LESSONS) {
  const courseId = courseIds[l.grade]
  lines.push(`insert into public.lessons (
  course_id, unit_number, theme, grammar, arabic, explanation, visual,
  objectives, session_flow, common_mistakes, teacher_notes, worksheet, homework, quiz_bank
) values (
  '${courseId}',
  ${l.unit_number},
  '${esc(l.theme)}',
  '${esc(l.grammar)}',
  '${esc(l.arabic)}',
  '${esc(l.explanation)}',
  ${jsonb(l.visual)},
  ${jsonb(l.objectives)},
  ${jsonb(l.session_flow)},
  ${jsonb(l.common_mistakes)},
  '${esc(l.teacher_notes)}',
  ${jsonb(l.worksheet)},
  ${jsonb(l.homework)},
  ${jsonb(l.quiz_bank)}
)
on conflict (course_id, unit_number) do update set
  theme = excluded.theme,
  grammar = excluded.grammar,
  arabic = excluded.arabic,
  explanation = excluded.explanation,
  visual = excluded.visual,
  objectives = excluded.objectives,
  session_flow = excluded.session_flow,
  common_mistakes = excluded.common_mistakes,
  teacher_notes = excluded.teacher_notes,
  worksheet = excluded.worksheet,
  homework = excluded.homework,
  quiz_bank = excluded.quiz_bank,
  updated_at = now();`)
  lines.push('')
}

const out = join(__dirname, '../supabase/seed.sql')
writeFileSync(out, lines.join('\n'))
console.log(`Wrote seed for ${ENRICHED_LESSONS.length} lessons → ${out}`)
