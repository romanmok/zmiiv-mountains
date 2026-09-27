'use server'

import { knex } from '@/lib/knex'
import { hashPassword, MIN_PASSWORD_LENGTH, verifyPassword } from '@/lib/auth/password'
import { destroyOtherSessions, requireActionUser } from '@/lib/auth/session'
import type { ActionResult } from '../_ui'

export async function changePassword(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const user = await requireActionUser()
  const current = String(formData.get('current') ?? '')
  const next = String(formData.get('next') ?? '')
  const repeat = String(formData.get('repeat') ?? '')

  if (next.length < MIN_PASSWORD_LENGTH) return { ok: false, error: `Новий пароль має бути не коротший за ${MIN_PASSWORD_LENGTH} символів.` }
  if (next !== repeat) return { ok: false, error: 'Новий пароль і повтор не збігаються.' }
  if (next === current) return { ok: false, error: 'Новий пароль збігається з поточним.' }

  const row = await knex('users').where({ id: user.id }).first('password_hash')
  if (!row || !(await verifyPassword(current, row.password_hash))) return { ok: false, error: 'Поточний пароль невірний.' }

  await knex('users').where({ id: user.id }).update({ password_hash: await hashPassword(next) })
  await destroyOtherSessions(user.id)
  return { ok: true, message: 'Пароль змінено. Інші пристрої розлогінено.' }
}
