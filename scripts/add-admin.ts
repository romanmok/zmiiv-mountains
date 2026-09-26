import path from 'node:path'
import { config as loadEnv } from 'dotenv'

loadEnv({ path: path.resolve(process.cwd(), '.env.local') })
loadEnv({ path: path.resolve(process.cwd(), '.env') })

import { knex } from '../src/lib/knex'
import { hashPassword, MIN_PASSWORD_LENGTH } from '../src/lib/auth/password'

// Usage: npm run add-admin -- <username> <password> ["Display name"]
// Existing username → password is reset and the account re-activated.
async function main() {
  const [username, password, displayName] = process.argv.slice(2)
  if (!username || !password) throw new Error('Usage: npm run add-admin -- <username> <password> ["Display name"]')
  if (!/^[a-z0-9._-]{3,64}$/.test(username)) throw new Error('Username: 3–64 chars, a-z 0-9 . _ -')
  if (password.length < MIN_PASSWORD_LENGTH) throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`)

  const password_hash = await hashPassword(password)
  const existing = await knex('users').where({ username }).first()
  if (existing) {
    await knex('users').where({ id: existing.id }).update({ password_hash, is_active: true, display_name: displayName ?? existing.display_name })
    await knex('sessions').where({ user_id: existing.id }).del()
    console.log(`Password reset for ${username}`)
  } else {
    await knex('users').insert({ username, password_hash, display_name: displayName ?? null })
    console.log(`Admin ${username} created`)
  }
}

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err)
    process.exitCode = 1
  })
  .finally(() => knex.destroy())
