'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { knex } from '@/lib/knex'
import { requireActionUser } from '@/lib/auth/session'
import { collectAll } from '@/lib/collectors'
import type { SourceType } from '@/lib/collectors/types'
import type { ActionResult } from '../_ui'

const TYPES: SourceType[] = ['rss', 'telegram', 'youtube']

/** Accepts what people paste: @handle, t.me links, YouTube channel links or ids. */
function normalizeSourceUrl(type: SourceType, raw: string): string {
  const v = raw.trim()
  if (type === 'telegram') return v.replace(/^https?:\/\/t\.me\/(s\/)?/i, '').replace(/^@/, '').replace(/[/?#].*$/, '')
  if (type === 'youtube') {
    const id = v.match(/(UC[\w-]{22})/)?.[1]
    if (id) return `https://www.youtube.com/feeds/videos.xml?channel_id=${id}`
  }
  return v
}

export async function saveSource(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireActionUser()
  const id = Number(formData.get('id')) || null
  const type = String(formData.get('type')) as SourceType
  const name = String(formData.get('name') ?? '').trim()
  const rawUrl = String(formData.get('url') ?? '')
  if (!name) return { ok: false, error: 'Вкажіть назву джерела.' }
  if (!TYPES.includes(type)) return { ok: false, error: 'Оберіть тип джерела.' }
  const url = normalizeSourceUrl(type, rawUrl)
  if (!url) return { ok: false, error: 'Вкажіть адресу стрічки або канал.' }
  if (type !== 'telegram' && !/^https?:\/\//.test(url)) return { ok: false, error: 'Адреса стрічки має починатися з http:// або https://.' }
  if (type === 'telegram' && !/^[A-Za-z0-9_]{4,64}$/.test(url)) return { ok: false, error: 'Telegram: вкажіть публічний канал, напр. @LN1210 або https://t.me/LN1210.' }
  if (type === 'youtube' && !url.includes('channel_id=')) return { ok: false, error: 'YouTube: вставте посилання на канал з ідентифікатором UC… (youtube.com/channel/UC…).' }

  const settlement = Number(formData.get('default_settlement_id')) || null
  const data = {
    name: name.slice(0, 128),
    type,
    url: url.slice(0, 512),
    site_url: String(formData.get('site_url') ?? '').trim().slice(0, 512) || (type === 'telegram' ? `https://t.me/${url}` : null),
    enabled: formData.get('enabled') === 'on',
    require_keyword: formData.get('require_keyword') === 'on',
    premoderate: formData.get('premoderate') === 'on',
    default_settlement_id: settlement,
  }

  const dup = await knex('sources').where({ url: data.url }).whereNot('id', id ?? 0).first('id')
  if (dup) return { ok: false, error: 'Таке джерело вже є в списку.' }

  let savedId = id
  if (id) await knex('sources').where({ id }).update(data)
  else [savedId] = await knex('sources').insert(data)
  revalidatePath('/admin/sources')
  if (!id) redirect(`/admin/sources/${savedId}?created=1`)
  return { ok: true, message: 'Збережено.' }
}

export async function deleteSource(formData: FormData): Promise<void> {
  await requireActionUser()
  const id = Number(formData.get('id'))
  // items cascade: removing a source removes its news from the feed
  await knex('sources').where({ id }).del()
  revalidatePath('/')
  redirect('/admin/sources')
}

export async function toggleSource(formData: FormData): Promise<void> {
  await requireActionUser()
  const id = Number(formData.get('id'))
  await knex('sources')
    .where({ id })
    .update({ enabled: knex.raw('NOT enabled') })
  revalidatePath('/admin/sources')
}

export async function collectSource(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireActionUser()
  const id = Number(formData.get('id'))
  const [st] = await collectAll([id])
  revalidatePath('/admin', 'layout')
  revalidatePath('/')
  if (!st) return { ok: false, error: 'Джерело не знайдено.' }
  if (st.error) return { ok: false, error: `Не вдалося зібрати: ${st.error}` }
  const skipped = Object.entries(st.skipped)
    .map(([k, n]) => `${SKIP_LABEL[k] ?? k}: ${n}`)
    .join(', ')
  return { ok: true, message: `Отримано ${st.fetched}, нових ${st.inserted}${skipped ? `. Пропущено — ${skipped}` : ''}.` }
}

const SKIP_LABEL: Record<string, string> = {
  duplicate: 'вже були',
  safety: 'безпека',
  noise: 'реклама',
  phone: 'телефон',
  off_topic: 'не про громаду',
}
