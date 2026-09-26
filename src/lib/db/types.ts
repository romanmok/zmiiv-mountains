export interface Settlement {
  id: number
  slug: string
  name: string
  kind: 'city' | 'village'
  map_x: number
  map_y: number
  label_x: number
  label_y: number
}

export interface FeedItem {
  id: number
  title: string
  url: string
  published_at: string
  settlement_id: number | null
  source_name: string
  source_type: 'rss' | 'telegram' | 'youtube'
  is_demo: boolean
}

export interface Route {
  id: number
  slug: string
  title: string
  kind: 'hike' | 'eco_trail' | 'bike' | 'water'
  length_km: string | null
  elevation_m: number | null
  description: string | null
  settlement_id: number | null
}

export interface Place {
  id: number
  slug: string
  name: string
  kind: string
  description: string | null
  attribution: string | null
}
