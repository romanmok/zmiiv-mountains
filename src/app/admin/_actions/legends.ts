'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { knex } from '@/lib/knex'
import { requireActionUser } from '@/lib/auth/session'
import type { ActionResult } from '../_ui'

export async function saveLegend(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireActionUser()
  const id = Number(formData.get('id')) || null
  const title = String(formData.get('title') ?? '').trim()
  const body = String(formData.get('body') ?? '').replace(/\r\n/g, '\n').trim()
  if (!title) return { ok: false, error: 'Вкажіть заголовок легенди.' }
  if (!body) return { ok: false, error: 'Текст легенди не може бути порожнім.' }
  const sourceUrl = String(formData.get('source_url') ?? '').trim()
  if (sourceUrl && !/^https?:\/\//.test(sourceUrl)) return { ok: false, error: 'Посилання має починатися з http:// або https://.' }

  const data = {
    title: title.slice(0, 256),
    body,
    note: String(formData.get('note') ?? '').trim() || null,
    settlement_id: Number(formData.get('settlement_id')) || null,
    source_url: sourceUrl.slice(0, 1024) || null,
    is_published: formData.get('is_published') === 'on',
  }
  let savedId = id
  if (id) await knex('legends').where({ id }).update({ ...data, updated_at: knex.fn.now() })
  else [savedId] = await knex('legends').insert(data)
  revalidatePath('/')
  revalidatePath('/admin/legends')
  if (!id) redirect(`/admin/legends/${savedId}?created=1`)
  return { ok: true, message: 'Збережено.' }
}

export async function deleteLegend(formData: FormData): Promise<void> {
  await requireActionUser()
  await knex('legends').where({ id: Number(formData.get('id')) }).del()
  revalidatePath('/')
  redirect('/admin/legends')
}
