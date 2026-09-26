import 'server-only'
import { cache } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createHash, randomBytes } from 'node:crypto'
import { knex } from '@/lib/knex'

// Server-side sessions (same scheme as maska-theatre): cookie holds a random token, DB holds its sha256.
const COOKIE = 'zm_session'
const TTL_MS = 30 * 24 * 60 * 60 * 1000

export interface SessionUser {
  id: number
  username: string
  displayName: string | null
}

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex')
const toSqlDate = (d: Date) => d.toISOString().slice(0, 19).replace('T', ' ')

async function setCookie(token: string, expires: Date) {
  const store = await cookies()
  store.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires,
  })
}

export async function createSession(userId: number, meta: { userAgent: string | null; ip: string | null }) {
  const token = randomBytes(32).toString('hex')
  const expires = new Date(Date.now() + TTL_MS)
  await knex('sessions').insert({
    id: hashToken(token),
    user_id: userId,
    expires_at: toSqlDate(expires),
    user_agent: meta.userAgent?.slice(0, 512) ?? null,
    ip: meta.ip?.slice(0, 64) ?? null,
  })
  await setCookie(token, expires)
}

export async function destroySession() {
  const store = await cookies()
  const token = store.get(COOKIE)?.value
  if (token) await knex('sessions').where({ id: hashToken(token) }).del()
  store.delete(COOKIE)
}

export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(COOKIE)?.value
  if (!token) return null
  const id = hashToken(token)
  const row = await knex('sessions as s')
    .join('users as u', 'u.id', 's.user_id')
    .where('s.id', id)
    .where('u.is_active', true)
    .where('s.expires_at', '>', toSqlDate(new Date()))
    .first('u.id', 'u.username', 'u.display_name', 's.expires_at')
  if (!row) return null

  // Roll the expiry once half of the TTL is used. Cookies can only be set outside of rendering,
  // so a failed set (render context) is fine: the next server action will roll it.
  const expiresAt = new Date(`${row.expires_at.replace(' ', 'T')}Z`)
  if (expiresAt.getTime() - Date.now() < TTL_MS / 2) {
    const next = new Date(Date.now() + TTL_MS)
    try {
      await setCookie(token, next)
      await knex('sessions').where({ id }).update({ expires_at: toSqlDate(next) })
    } catch {
      /* rendering context */
    }
  }
  return { id: row.id, username: row.username, displayName: row.display_name }
})

/** For admin pages: redirects to the login form without a session. */
export async function requirePageUser(): Promise<SessionUser> {
  const user = await getCurrentUser()
  if (!user) redirect('/admin/login')
  return user
}

/** For server actions: throws without a session (the proxy does not cover action POSTs by itself). */
export async function requireActionUser(): Promise<SessionUser> {
  const user = await getCurrentUser()
  if (!user) throw new Error('Не авторизовано')
  return user
}
