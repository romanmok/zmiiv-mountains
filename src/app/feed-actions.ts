'use server'

import { getFeedPage, type FeedPage } from '@/lib/feed'

/** Public read-only action behind "load more" and the settlement filter. */
export async function loadFeed(offset: number, settlementId: number | null): Promise<FeedPage> {
  const safeOffset = Number.isInteger(offset) && offset >= 0 ? Math.min(offset, 2000) : 0
  const safeId = Number.isInteger(settlementId) && Number(settlementId) > 0 ? settlementId : null
  return getFeedPage(safeOffset, safeId)
}
