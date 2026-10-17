import { spawnSync } from 'node:child_process'

const EVENT_SLUG = '2026-11-19-tech-table'
const IN_PERSON_MODES = [
  'in_person_full_event',
  'in_person_program_only',
  'in_person_happy_hour_only',
]

function usage(): never {
  console.error('Usage: tsx scripts/export-event-rsvp-roster.ts [--local | --remote --confirm-remote]')
  process.exit(2)
}

const args = new Set(process.argv.slice(2))
if (args.has('--help')) usage()
const remote = args.has('--remote')
if (args.has('--local') && remote) usage()
if (remote && !args.has('--confirm-remote')) {
  console.error('Remote read refused: add --confirm-remote after verifying the Cloudflare account and database.')
  process.exit(2)
}

const quotedModes = IN_PERSON_MODES.map((mode) => `'${mode}'`).join(', ')
const sql = `SELECT full_name, email_normalized AS email, attendance_mode, lab_interest, cm_credit, created_at, updated_at FROM event_rsvps WHERE event_slug = '${EVENT_SLUG}' AND attendance_mode IN (${quotedModes}) ORDER BY full_name COLLATE NOCASE, email_normalized;`
const commandArgs = [
  'exec',
  'wrangler',
  'd1',
  'execute',
  'DB',
  remote ? '--remote' : '--local',
  '--command',
  sql,
  '--json',
]
const result = spawnSync('pnpm', commandArgs, { encoding: 'utf8' })
if (result.status !== 0) {
  process.stderr.write(result.stderr || result.stdout)
  process.exit(result.status ?? 1)
}

let payload: Array<{ results?: Array<Record<string, unknown>> }>
try {
  payload = JSON.parse(result.stdout) as Array<{ results?: Array<Record<string, unknown>> }>
} catch {
  console.error('Could not parse Wrangler JSON output.')
  process.stderr.write(result.stderr)
  process.exit(1)
}

const rows = payload.flatMap((entry) => entry.results ?? [])
const columns = ['full_name', 'email', 'attendance_mode', 'lab_interest', 'cm_credit', 'created_at', 'updated_at']
const csv = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`
console.log(columns.join(','))
for (const row of rows) console.log(columns.map((column) => csv(row[column])).join(','))
