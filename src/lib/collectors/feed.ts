import { XMLParser } from 'fast-xml-parser'
import type { Driver, RawEntry } from './types'
import { stripHtml } from './text'

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' })

const asArray = <T>(v: T | T[] | undefined): T[] => (v === undefined ? [] : Array.isArray(v) ? v : [v])

const textOf = (v: unknown): string =>
  typeof v === 'string' ? v : v && typeof v === 'object' && '#text' in v ? String((v as { '#text': unknown })['#text']) : ''

/** RSS 2.0 and Atom (YouTube channel feeds are Atom). */
export const feedDriver: Driver = async (source) => {
  const res = await fetch(source.url, { headers: { 'user-agent': 'zmiiv-mountains/0.1 (+aggregator)' }, signal: AbortSignal.timeout(20_000) })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const doc = parser.parse(await res.text())

  const entries: RawEntry[] = []
  for (const it of asArray(doc?.rss?.channel?.item)) {
    entries.push({
      title: stripHtml(textOf(it.title)),
      text: stripHtml(textOf(it.description)),
      url: textOf(it.link),
      publishedAt: new Date(textOf(it.pubDate) || Date.now()),
      thumbUrl: it.enclosure?.['@_url'] ?? null,
    })
  }
  for (const it of asArray(doc?.feed?.entry)) {
    const link = asArray(it.link).find((l: Record<string, string>) => !l['@_rel'] || l['@_rel'] === 'alternate')
    const group = it['media:group']
    entries.push({
      title: stripHtml(textOf(it.title)),
      text: stripHtml(textOf(it.summary) || textOf(group?.['media:description'])),
      url: link?.['@_href'] ?? '',
      publishedAt: new Date(textOf(it.published) || textOf(it.updated) || Date.now()),
      thumbUrl: group?.['media:thumbnail']?.['@_url'] ?? null,
    })
  }
  return entries.filter((e) => e.title && e.url)
}
