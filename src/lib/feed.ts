import 'server-only'
import type { FeedCard } from '@/components/Explorer'
import { getFeed } from './db/queries'
import { relativeDate } from './time'

export const FEED_PAGE = 9

export interface FeedPage {
  items: FeedCard[]
  hasMore: boolean
}

/** One page of the public feed; fetches one extra row to know whether "load more" is needed. */
export async function getFeedPage(offset: number, settlementId: number | null): Promise<FeedPage> {
  const rows = await getFeed({ limit: FEED_PAGE + 1, offset, settlementId })
  const now = new Date()
  return {
    hasMore: rows.length > FEED_PAGE,
    items: rows.slice(0, FEED_PAGE).map((i) => ({
      id: i.id,
      title: i.title,
      url: i.url,
      settlementId: i.settlement_id,
      sourceName: i.source_name,
      dateLabel: relativeDate(i.published_at, now),
      isDemo: i.is_demo,
    })),
  }
}
