'use server'

import { revalidatePath } from 'next/cache'
import { knex } from '@/lib/knex'
import { requireActionUser } from '@/lib/auth/session'

const OPS = {
  publish: { status: 'published', filter_reason: null },
  hide: { status: 'hidden' },
  pin: { pinned: true },
  unpin: { pinned: false },
} as const
type Op = keyof typeof OPS

/**
 * One action for the whole moderation list.
 * Row buttons send op="publish:42"; bulk buttons send op="publish" and apply it to the checked `ids`.
 */
export async function moderateItems(formData: FormData): Promise<void> {
  await requireActionUser()
  const [op, rowId] = String(formData.get('op') ?? '').split(':')
  if (!(op in OPS)) return
  const ids = rowId ? [Number(rowId)] : formData.getAll('ids').map(Number)
  const clean = ids.filter((n) => Number.isInteger(n) && n > 0)
  if (!clean.length) return
  const patch: Record<string, unknown> = { ...OPS[op as Op] }
  // A pinned card is always a published one
  if (op === 'pin') patch.status = 'published'
  await knex('items').whereIn('id', clean).update(patch)
  revalidatePath('/')
  revalidatePath('/admin', 'layout')
}

export async function setItemSettlement(itemId: number, settlementId: number | null): Promise<void> {
  await requireActionUser()
  await knex('items').where({ id: itemId }).update({ settlement_id: settlementId })
  revalidatePath('/')
}
