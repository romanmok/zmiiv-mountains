'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { knex } from '@/lib/knex'
import { requireActionUser } from '@/lib/auth/session'
import { safeUrl } from '@/lib/route-body'
import { slugify } from '@/lib/slug'
import type { ActionResult } from '../_ui'

const KINDS = ['hike', 'eco_trail', 'bike', 'water']

const num = (v: FormDataEntryValue | null) => {
  const s = String(v ?? '').replace(',', '.').trim()
  return s === '' ? null : Number(s)
}

export async function saveRoute(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireActionUser()
  const id = Number(formData.get('id')) || null
  const title = String(formData.get('title') ?? '').trim()
  const kind = String(formData.get('kind'))
  if (!title) return { ok: false, error: 'Вкажіть назву маршруту.' }
  if (!KINDS.includes(kind)) return { ok: false, error: 'Оберіть тип маршруту.' }
  const length = num(formData.get('length_km'))
  const elevation = num(formData.get('elevation_m'))
  if (length !== null && (!Number.isFinite(length) || length <= 0 || length > 999)) return { ok: false, error: 'Довжина — число в кілометрах, напр. 11,8.' }
  if (elevation !== null && (!Number.isInteger(elevation) || elevation < 0)) return { ok: false, error: 'Набір висоти — ціле число метрів.' }
  const sourceUrl = String(formData.get('source_url') ?? '').trim()
  if (sourceUrl && !/^https?:\/\//.test(sourceUrl)) return { ok: false, error: 'Посилання має починатися з http:// або https://.' }
  const coverUrl = String(formData.get('cover_url') ?? '').trim()
  if (coverUrl && !safeUrl(coverUrl)) return { ok: false, error: 'Обкладинка: завантажте фото або вставте посилання http(s).' }

  const slug = slugify(String(formData.get('slug') ?? '') || title)
  if (!slug) return { ok: false, error: 'Не вдалося скласти адресу з назви: вкажіть її латиницею.' }
  const dup = await knex('routes').where({ slug }).whereNot('id', id ?? 0).first('id')
  if (dup) return { ok: false, error: `Адреса «${slug}» вже зайнята іншим маршрутом.` }

  const data = {
    title: title.slice(0, 256),
    slug,
    kind,
    settlement_id: Number(formData.get('settlement_id')) || null,
    length_km: length,
    elevation_m: elevation,
    description: String(formData.get('description') ?? '').trim() || null,
    source_url: sourceUrl.slice(0, 1024) || null,
    cover_url: coverUrl.slice(0, 1024) || null,
    body: String(formData.get('body') ?? '').replace(/\r\n/g, '\n').trim() || null,
    is_published: formData.get('is_published') === 'on',
    sort_order: Number(formData.get('sort_order')) || 0,
  }
  let savedId = id
  const old = id ? await knex('routes').where({ id }).first('slug') : null
  if (id) await knex('routes').where({ id }).update({ ...data, updated_at: knex.fn.now() })
  else [savedId] = await knex('routes').insert(data)
  revalidatePath('/')
  revalidatePath('/admin/routes')
  revalidatePath(`/routes/${slug}`)
  if (old && old.slug !== slug) revalidatePath(`/routes/${old.slug}`)
  if (!id) redirect(`/admin/routes/${savedId}?created=1`)
  return { ok: true, message: 'Збережено.' }
}

export async function deleteRoute(formData: FormData): Promise<void> {
  await requireActionUser()
  const id = Number(formData.get('id'))
  const row = await knex('routes').where({ id }).first('slug')
  await knex('routes').where({ id }).del()
  revalidatePath('/')
  if (row) revalidatePath(`/routes/${row.slug}`)
  redirect('/admin/routes')
}

/** Swap sort_order with the neighbour above/below. */
export async function moveRoute(formData: FormData): Promise<void> {
  await requireActionUser()
  const id = Number(formData.get('id'))
  const dir = formData.get('dir') === 'up' ? 'up' : 'down'
  const rows: { id: number }[] = await knex('routes').select('id').orderBy([{ column: 'sort_order' }, { column: 'id' }])
  const i = rows.findIndex((r) => r.id === id)
  const j = dir === 'up' ? i - 1 : i + 1
  if (i < 0 || j < 0 || j >= rows.length) return
  ;[rows[i], rows[j]] = [rows[j], rows[i]]
  await knex.transaction(async (trx) => {
    for (const [n, r] of rows.entries()) await trx('routes').where({ id: r.id }).update({ sort_order: n })
  })
  revalidatePath('/')
  revalidatePath('/admin/routes')
}
