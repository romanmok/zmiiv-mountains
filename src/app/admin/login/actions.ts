'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { knex } from '@/lib/knex'
import { verifyPassword } from '@/lib/auth/password'
import { createSession, destroySession } from '@/lib/auth/session'

export type LoginState = { error?: string } | undefined

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const username = String(formData.get('username') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')
  if (!username || !password) return { error: 'Введіть логін і пароль.' }

  const user = await knex('users').where({ username }).first()
  // Same message for unknown user and wrong password
  if (!user || !user.is_active || !(await verifyPassword(password, user.password_hash))) {
    return { error: 'Невірний логін або пароль.' }
  }

  const h = await headers()
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null
  await createSession(user.id, { userAgent: h.get('user-agent'), ip })
  redirect('/admin')
}

export async function logoutAction(): Promise<void> {
  await destroySession()
  redirect('/admin/login')
}
