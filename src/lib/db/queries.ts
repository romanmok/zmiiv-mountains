import { knex } from '../knex'
import type { FeedItem, Place, Route, Settlement } from './types'

export async function getSettlements(): Promise<Settlement[]> {
  return knex('settlements')
    .select('id', 'slug', 'name', 'kind', 'map_x', 'map_y', 'label_x', 'label_y')
    .orderBy('sort_order')
}

export async function getFeed({ limit = 10, offset = 0, settlementId = null }: { limit?: number; offset?: number; settlementId?: number | null } = {}): Promise<FeedItem[]> {
  const q = knex('items as i')
    .join('sources as s', 's.id', 'i.source_id')
    .where('i.status', 'published')
  if (settlementId) q.where('i.settlement_id', settlementId)
  const rows = await q
    .select(
      'i.id',
      'i.title',
      'i.url',
      'i.published_at',
      'i.settlement_id',
      'i.is_demo',
      's.name as source_name',
      's.type as source_type',
    )
    .orderBy([
      { column: 'i.pinned', order: 'desc' },
      { column: 'i.published_at', order: 'desc' },
      // tie-breaker keeps pages stable for "load more"
      { column: 'i.id', order: 'desc' },
    ])
    .limit(limit)
    .offset(offset)
  return rows.map((r) => ({ ...r, is_demo: Boolean(r.is_demo) }))
}

export async function getRoutes(): Promise<Route[]> {
  return knex('routes')
    .where({ is_published: true })
    .select('id', 'slug', 'title', 'kind', 'length_km', 'elevation_m', 'description', 'source_url', 'settlement_id')
    .orderBy([{ column: 'sort_order' }, { column: 'id' }])
}

export async function getPlaces(): Promise<Place[]> {
  return knex('places').select('id', 'slug', 'name', 'kind', 'description', 'attribution').orderBy('sort_order')
}
