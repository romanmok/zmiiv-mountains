import type { Driver, RawEntry } from './types'
import { stripHtml, titleFromText } from './text'

/** Public channel preview https://t.me/s/<handle> — no API key, last ~20 posts. */
export const telegramDriver: Driver = async (source) => {
  const handle = source.url.replace(/^@/, '')
  const res = await fetch(`https://t.me/s/${handle}`, { headers: { 'user-agent': 'zmiiv-mountains/0.1 (+aggregator)' }, signal: AbortSignal.timeout(20_000) })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return parseTelegramPreview(await res.text())
}

export function parseTelegramPreview(html: string): RawEntry[] {
  const entries: RawEntry[] = []
  for (const block of html.split('data-post="').slice(1)) {
    const post = block.slice(0, block.indexOf('"'))
    const textHtml = block.match(/tgme_widget_message_text[^>]*>([\s\S]*?)<\/div>/)?.[1]
    const datetime = block.match(/<time[^>]*datetime="([^"]+)"/)?.[1]
    if (!post || !textHtml || !datetime) continue
    const text = stripHtml(textHtml)
    const thumb = block.match(/tgme_widget_message_photo_wrap[^>]*background-image:url\('([^']+)'\)/)?.[1] ?? null
    entries.push({ title: titleFromText(text), text, url: `https://t.me/${post}`, publishedAt: new Date(datetime), thumbUrl: thumb })
  }
  return entries.filter((e) => e.title)
}
