import { knex } from '../knex'
import type { FeedItem, Place, Route, Settlement } from './types'

export async function getSettlements(): Promise<Settlement[]> {
  return knex('settlements')
    .select('id', 'slug', 'name', 'kind', 'map_x', 'map_y', 'label_x', 'label_y')
    .orderBy('sort_order')
}

export async function getFeed(limit = 60): Promise<FeedItem[]> {
  const rows = await knex('items as i')
    .join('sources as s', 's.id', 'i.source_id')
    .where('i.status', 'published')
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
    ])
    .limit(limit)
  return rows.map((r) => ({ ...r, is_demo: Boolean(r.is_demo) }))
}

export async function getRoutes(): Promise<Route[]> {
  return knex('routes')
    .select('id', 'slug', 'title', 'kind', 'length_km', 'elevation_m', 'description', 'settlement_id')
    .orderBy('sort_order')
}

export async function getPlaces(): Promise<Place[]> {
  return knex('places').select('id', 'slug', 'name', 'kind', 'description', 'attribution').orderBy('sort_order')
}
