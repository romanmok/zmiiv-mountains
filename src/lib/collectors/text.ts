const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'", nbsp: ' ' }

export function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&(#?\w+);/g, (m, e: string) =>
      ENTITIES[e] ?? (e.startsWith('#') ? String.fromCodePoint(Number(e.slice(1).replace(/^x/, '0x'))) : m),
    )
    .replace(/[ \t]+/g, ' ')
    .trim()
}

export function excerpt(text: string, max = 280): string {
  const flat = text.replace(/\s+/g, ' ').trim()
  if (flat.length <= max) return flat
  return flat.slice(0, flat.lastIndexOf(' ', max) > 0 ? flat.lastIndexOf(' ', max) : max) + '…'
}

const HASHTAGS_ONLY = /^(#[\p{L}\p{N}_]+\s*)+$/u

/** Telegram posts have no title: use the first meaningful line (not hashtags), shortened. */
export function titleFromText(text: string, max = 140): string {
  const first = text.split('\n').map((l) => l.trim()).find((l) => l && !HASHTAGS_ONLY.test(l)) ?? ''
  return excerpt(first, max)
}
