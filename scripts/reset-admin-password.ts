/**
 * DEV-282 ops helper — reset the owner admin's password from the CLI.
 * Usage: node_modules/.bin/tsx scripts/reset-admin-password.ts '<email>'
 * Mirrors payload's generatePasswordSaltHash (pbkdf2-sha256 600k iters, 32B key,
 * 'pbkdf2-sha256-v1:' hex prefix, random 32B hex salt), writes salt+hash
 * directly to SQLite (node:sqlite, no native dep), clears any login lockout,
 * prints the temp password ONCE to stdout.
 */
import crypto from 'crypto'
import path from 'path'
import { DatabaseSync } from 'node:sqlite'

const ITERATIONS = 600_000
const KEY_LENGTH = 32
const PREFIX = 'pbkdf2-sha256-v1:'

async function main() {
  const email = process.argv[2]
  if (!email) {
    console.error('usage: tsx scripts/reset-admin-password.ts <email>')
    process.exit(2)
  }
  const temp = 'Temp-' + Math.random().toString(36).slice(2, 10) + '!'
  const salt = crypto.randomBytes(32).toString('hex')
  const hash = PREFIX + crypto.pbkdf2Sync(temp, salt, ITERATIONS, KEY_LENGTH, 'sha256').toString('hex')

  const dbFile = path.resolve(
    (process.env.DATABASE_URI ?? 'file:./apa-nym-techcomm-website.db').replace(/^file:/, ''),
  )

  const db = new DatabaseSync(dbFile)
  const result = db
    .prepare(
      'UPDATE users SET salt = ?, hash = ?, login_attempts = 0, lock_until = NULL WHERE email = ?',
    )
    .run(salt, hash, email)
  db.close()
  if (result.changes === 0) {
    console.error(`no user updated for ${email}`)
    process.exit(1)
  }
  console.log(`TEMP PASSWORD for ${email}: ${temp}`)
  console.log('Change it from Account settings after logging in.')
}

void main()