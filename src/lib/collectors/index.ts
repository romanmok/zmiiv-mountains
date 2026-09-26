import { createHash } from 'node:crypto'
import { knex } from '../knex'
import { feedDriver } from './feed'
import { telegramDriver } from './telegram'
import { checkEntry, detectSettlement, parseKeywords, type FilterRules, type SettlementKeywords } from './filters'
import { excerpt } from './text'
import type { Driver, SourceRow, SourceType } from './types'

const DRIVERS: Record<SourceType, Driver> = {
  rss: feedDriver,
  youtube: feedDriver,
  telegram: telegramDriver,
}

export interface CollectStats {
  source: string
  fetched: number
  inserted: number
  skipped: Record<string, number>
  error?: string
}

const toSqlDate = (d: Date) => (isNaN(d.getTime()) ? new Date() : d).toISOString().slice(0, 19).replace('T', ' ')

export async function loadSettlementKeywords(): Promise<SettlementKeywords[]> {
  const rows: { id: number; keywords: string }[] = await knex('settlements').select('id', 'keywords').orderBy('sort_order')
  return rows.map((s) => ({ id: s.id, keywords: parseKeywords(s.keywords) }))
}

export async function loadFilterRules(): Promise<FilterRules> {
  const words: { kind: 'safety' | 'noise'; word: string }[] = await knex('filter_words').select('kind', 'word')
  const phones = await knex('settings').where({ key: 'filter_block_phones' }).first()
  return {
    safety: words.filter((w) => w.kind === 'safety').map((w) => w.word),
    noise: words.filter((w) => w.kind === 'noise').map((w) => w.word),
    blockPhones: phones ? phones.value !== '0' : true,
  }
}

/** Collect all enabled sources, or only the given ones (enabled or not, for "collect now" in the admin). */
export async function collectAll(onlyIds?: number[]): Promise<CollectStats[]> {
  const [settlements, rules] = await Promise.all([loadSettlementKeywords(), loadFilterRules()])
  const q = knex('sources')
  const sources: SourceRow[] = onlyIds ? await q.whereIn('id', onlyIds) : await q.where({ enabled: true })
  const stats: CollectStats[] = []

  for (const source of sources) {
    const st: CollectStats = { source: source.name, fetched: 0, inserted: 0, skipped: {} }
    try {
      const entries = await DRIVERS[source.type](source)
      st.fetched = entries.length
      for (const e of entries) {
        const full = `${e.title}\n${e.text}`
        const verdict = checkEntry(full, Boolean(source.require_keyword), settlements, rules)
        // Filtered entries are stored too (never shown) so the moderator can see and rescue false positives
        const status = !verdict.ok ? 'filtered' : source.premoderate ? 'pending' : 'published'
        const inserted = await knex('items')
          .insert({
            source_id: source.id,
            settlement_id: detectSettlement(full, settlements) ?? source.default_settlement_id,
            title: e.title.slice(0, 512),
            excerpt: e.text ? excerpt(e.text) : null,
            url: e.url,
            url_hash: createHash('sha256').update(e.url).digest('hex'),
            thumb_url: e.thumbUrl ?? null,
            published_at: toSqlDate(e.publishedAt),
            status,
            filter_reason: verdict.ok ? null : verdict.match ? `${verdict.reason}:${verdict.match}`.slice(0, 32) : verdict.reason,
          })
          .onConflict('url_hash')
          .ignore()
        if (!inserted[0]) st.skipped.duplicate = (st.skipped.duplicate ?? 0) + 1
        else if (!verdict.ok) st.skipped[verdict.reason] = (st.skipped[verdict.reason] ?? 0) + 1
        else st.inserted++
      }
      await knex('sources').where({ id: source.id }).update({ last_fetched_at: knex.fn.now(), last_error: null })
    } catch (err) {
      st.error = err instanceof Error ? err.message : String(err)
      await knex('sources').where({ id: source.id }).update({ last_error: st.error.slice(0, 1024) })
    }
    stats.push(st)
  }
  // Demo cards only fill the feed until the first real items arrive
  if (stats.some((s) => s.inserted > 0)) await knex('items').where({ is_demo: true }).del()
  return stats
}
