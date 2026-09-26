import { createHash } from 'node:crypto'
import { knex } from '../knex'
import { feedDriver } from './feed'
import { telegramDriver } from './telegram'
import { checkEntry, detectSettlement, type SettlementKeywords } from './filters'
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

export async function collectAll(): Promise<CollectStats[]> {
  const settlements: SettlementKeywords[] = (await knex('settlements').select('id', 'keywords').orderBy('sort_order')).map(
    (s: { id: number; keywords: string }) => ({ id: s.id, keywords: s.keywords.split(',').map((k) => k.trim()) }),
  )
  const sources: SourceRow[] = await knex('sources').where({ enabled: true })
  const stats: CollectStats[] = []

  for (const source of sources) {
    const st: CollectStats = { source: source.name, fetched: 0, inserted: 0, skipped: {} }
    try {
      const entries = await DRIVERS[source.type](source)
      st.fetched = entries.length
      for (const e of entries) {
        const full = `${e.title}\n${e.text}`
        const verdict = checkEntry(full, Boolean(source.require_keyword), settlements)
        if (!verdict.ok) {
          st.skipped[verdict.reason] = (st.skipped[verdict.reason] ?? 0) + 1
          continue
        }
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
          })
          .onConflict('url_hash')
          .ignore()
        if (inserted[0]) st.inserted++
        else st.skipped.duplicate = (st.skipped.duplicate ?? 0) + 1
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
