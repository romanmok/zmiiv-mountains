'use server'

import { revalidatePath } from 'next/cache'
import { knex } from '@/lib/knex'
import { requireActionUser } from '@/lib/auth/session'
import { SETTING_FIELDS } from '@/lib/settings'
import type { ActionResult } from '../_ui'

export async function saveSettings(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireActionUser()
  const rows: { key: string; value: string }[] = []
  for (const [name, value] of formData.entries()) {
    if (typeof value !== 'string' || !name.startsWith('s_')) continue
    const key = name.slice(2)
    // Only known keys: the form cannot create arbitrary settings
    if (SETTING_FIELDS.has(key)) rows.push({ key, value: value.trim() })
  }
  if (rows.length) await knex('settings').insert(rows).onConflict('key').merge()
  revalidatePath('/', 'layout')
  return { ok: true, message: 'Збережено. Зміни вже на сайті.' }
}

export async function resetSetting(key: string): Promise<void> {
  await requireActionUser()
  if (!SETTING_FIELDS.has(key)) return
  await knex('settings').where({ key }).del()
  revalidatePath('/', 'layout')
}
