export type SourceType = 'rss' | 'telegram' | 'youtube'

export interface SourceRow {
  id: number
  name: string
  type: SourceType
  url: string
  require_keyword: boolean
  default_settlement_id: number | null
}

/** Raw entry as returned by a driver, before the pipeline. */
export interface RawEntry {
  title: string
  text: string
  url: string
  publishedAt: Date
  thumbUrl?: string | null
}

export type Driver = (source: SourceRow) => Promise<RawEntry[]>
