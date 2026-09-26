// Stop-word lists live in the `filter_words` table (edited in /admin/filters).
// These defaults seed it and are used by tests.

// Martial law: never publish anything that can reveal alerts, strikes or military activity.
export const DEFAULT_SAFETY = [
  'тривог', 'відбій', 'укритт', 'вибух', 'обстріл', 'приліт', 'прильот', 'ракет', 'шахед', 'дрон',
  'бпла', 'ппо', 'сирен', 'техніка рухається', 'колона', 'блокпост', 'тцк', 'повістк',
  'тревог', 'взрыв', 'обстрел', 'прилет',
]

// Ads and personal posts from public chats/channels.
export const DEFAULT_NOISE = [
  '#реклама', 'реклама', 'продам', 'продаю', 'куплю', 'здам', 'сдам', 'оренда', 'аренда',
  'знижк', 'скидк', 'загубил', 'загубив', 'потерял', 'шукаю', 'ищу ', 'ваканс', 'до команди',
  'натяжн', 'доставка', 'замовлення за',
]

// Phone numbers in a post = private listing or ad: never republish personal data.
const PHONE = /(\+?38)?\s?\(?0\d{2}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}/

export function normalize(text: string): string {
  return text.toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ')
}

export type FilterReason = 'safety' | 'noise' | 'phone' | 'off_topic'
export type Verdict = { ok: true } | { ok: false; reason: FilterReason; match?: string }

export interface SettlementKeywords {
  id: number
  keywords: string[]
}

export interface FilterRules {
  safety: string[]
  noise: string[]
  blockPhones: boolean
}

export const DEFAULT_RULES: FilterRules = { safety: DEFAULT_SAFETY, noise: DEFAULT_NOISE, blockPhones: true }

export function checkEntry(
  text: string,
  requireKeyword: boolean,
  settlements: SettlementKeywords[],
  rules: FilterRules = DEFAULT_RULES,
): Verdict {
  const t = normalize(text)
  const safety = rules.safety.find((w) => w && t.includes(normalize(w)))
  if (safety) return { ok: false, reason: 'safety', match: safety }
  const noise = rules.noise.find((w) => w && t.includes(normalize(w)))
  if (noise) return { ok: false, reason: 'noise', match: noise }
  if (rules.blockPhones && PHONE.test(t)) return { ok: false, reason: 'phone' }
  // The city is a settlement too, so its keywords (зміїв, змиев…) count as an area mention
  if (requireKeyword && detectSettlement(t, settlements) === null) return { ok: false, reason: 'off_topic' }
  return { ok: true }
}

/** Last settlement whose keyword stem appears in the text; villages win over the city (city is sorted first). */
export function detectSettlement(text: string, settlements: SettlementKeywords[]): number | null {
  const t = normalize(text)
  let found: number | null = null
  for (const s of settlements) {
    if (s.keywords.some((k) => k && t.includes(normalize(k)))) found = s.id
  }
  return found
}

export function parseKeywords(csv: string): string[] {
  return csv
    .split(/[,\n]/)
    .map((k) => k.trim().toLowerCase())
    .filter(Boolean)
}
