'use server'

import { revalidatePath } from 'next/cache'
import { knex } from '@/lib/knex'
import { requireActionUser } from '@/lib/auth/session'
import { checkEntry, detectSettlement, parseKeywords } from '@/lib/collectors/filters'
import { loadFilterRules, loadSettlementKeywords } from '@/lib/collectors'
import type { ActionResult } from '../_ui'

const lines = (v: FormDataEntryValue | null) => [
  ...new Set(
    String(v ?? '')
      .split('\n')
      // No trimEnd: a trailing space marks a word end on purpose ("ищу " must not match "ищущий")
      .map((w) => w.replace(/\r$/, '').trimStart().toLowerCase().slice(0, 128))
      .filter((w) => w.trim()),
  ),
]

export async function saveFilters(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireActionUser()
  const safety = lines(formData.get('safety'))
  const noise = lines(formData.get('noise'))
  await knex.transaction(async (trx) => {
    await trx('filter_words').del()
    const rows = [...safety.map((word) => ({ kind: 'safety', word })), ...noise.map((word) => ({ kind: 'noise', word }))]
    if (rows.length) await trx('filter_words').insert(rows)
    await trx('settings')
      .insert({ key: 'filter_block_phones', value: formData.get('block_phones') === 'on' ? '1' : '0' })
      .onConflict('key')
      .merge()
  })
  revalidatePath('/admin/filters')
  return { ok: true, message: `Збережено: ${safety.length} слів безпеки, ${noise.length} слів реклами. Діє з наступного збору.` }
}

export async function saveSettlements(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireActionUser()
  const ids = formData.getAll('settlement_id').map(Number)
  for (const id of ids) {
    const name = String(formData.get(`name_${id}`) ?? '').trim()
    const keywords = parseKeywords(String(formData.get(`kw_${id}`) ?? ''))
    if (!name) return { ok: false, error: 'У кожного населеного пункту має бути назва.' }
    if (!keywords.length) return { ok: false, error: `${name}: додайте хоча б одне ключове слово.` }
    await knex('settlements')
      .where({ id })
      .update({ name: name.slice(0, 128), keywords: keywords.join(',').slice(0, 512) })
  }
  revalidatePath('/')
  revalidatePath('/admin/filters')
  return { ok: true, message: 'Збережено. Нові новини отримуватимуть село за цими словами.' }
}

export type TestResult = { verdict: string; settlement: string | null } | null

const VERDICT: Record<string, string> = {
  safety: 'Не пройде: воєнна безпека',
  noise: 'Не пройде: реклама чи особисте',
  phone: 'Не пройде: номер телефону',
  off_topic: 'Не пройде: не про громаду',
}

/** Dry run of the current saved rules on a pasted text. */
export async function testFilters(_prev: TestResult, formData: FormData): Promise<TestResult> {
  await requireActionUser()
  const text = String(formData.get('text') ?? '')
  const [settlements, rules] = await Promise.all([loadSettlementKeywords(), loadFilterRules()])
  const v = checkEntry(text, formData.get('require_keyword') === 'on', settlements, rules)
  const sid = detectSettlement(text, settlements)
  const settlement = sid ? ((await knex('settlements').where({ id: sid }).first('name'))?.name ?? null) : null
  return {
    verdict: v.ok ? 'Пройде у стрічку' : `${VERDICT[v.reason]}${v.match ? ` (слово «${v.match}»)` : ''}`,
    settlement,
  }
}

/** Apply the current stop-words to what is already in the feed or the queue. */
export async function recheckItems(_prev: ActionResult): Promise<ActionResult> {
  await requireActionUser()
  const [settlements, rules] = await Promise.all([loadSettlementKeywords(), loadFilterRules()])
  const items: { id: number; title: string; excerpt: string | null; pinned: number }[] = await knex('items')
    .whereIn('status', ['published', 'pending'])
    .where({ is_demo: false })
    .select('id', 'title', 'excerpt', 'pinned')
  let moved = 0
  for (const it of items) {
    // Pinned items were chosen by a moderator: never auto-hide them. Area check is per-source, skip it here.
    if (it.pinned) continue
    const v = checkEntry(`${it.title}\n${it.excerpt ?? ''}`, false, settlements, rules)
    if (v.ok) continue
    await knex('items')
      .where({ id: it.id })
      .update({ status: 'filtered', filter_reason: (v.match ? `${v.reason}:${v.match}` : v.reason).slice(0, 32) })
    moved++
  }
  revalidatePath('/')
  revalidatePath('/admin', 'layout')
  return { ok: true, message: moved ? `Прибрано зі стрічки: ${moved}. Їх видно у вкладці «Відсіяні фільтрами».` : 'Усе чисто: нових збігів немає.' }
}
