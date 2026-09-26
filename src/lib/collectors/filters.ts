// Martial law: never publish anything that can reveal alerts, strikes or military activity.
const SAFETY_STOP = [
  'тривог', 'відбій', 'укритт', 'вибух', 'обстріл', 'приліт', 'прильот', 'ракет', 'шахед', 'дрон',
  'бпла', 'ппо', 'сирен', 'техніка рухається', 'колона', 'блокпост', 'тцк', 'повістк',
  'тревог', 'взрыв', 'обстрел', 'прилет', 'ракет', 'сирен',
]

// Ads and personal posts from public chats/channels.
const NOISE_STOP = [
  '#реклама', 'реклама', 'продам', 'продаю', 'куплю', 'здам', 'сдам', 'оренда', 'аренда',
  'знижк', 'скидк', 'загубил', 'загубив', 'потерял', 'шукаю', 'ищу ', 'ваканс', 'до команди',
  'натяжн', 'доставка', 'замовлення за',
]

// Phone numbers in a post = private listing or ad: never republish personal data.
const PHONE = /(\+?38)?\s?\(?0\d{2}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}/

// Mentions of the city itself (uk + ru spelling in local channels).
const ZMIIV_STEMS = ['зміїв', 'змієв', 'змиев', 'змиёв', 'зміївськ', 'змиевск']

function normalize(text: string): string {
  return text.toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ')
}

export type Verdict = { ok: true } | { ok: false; reason: 'safety' | 'noise' | 'off_topic' }

export interface SettlementKeywords {
  id: number
  keywords: string[]
}

export function checkEntry(text: string, requireKeyword: boolean, settlements: SettlementKeywords[]): Verdict {
  const t = normalize(text)
  if (SAFETY_STOP.some((w) => t.includes(normalize(w)))) return { ok: false, reason: 'safety' }
  if (NOISE_STOP.some((w) => t.includes(normalize(w))) || PHONE.test(t)) return { ok: false, reason: 'noise' }
  if (requireKeyword && !mentionsArea(t, settlements)) return { ok: false, reason: 'off_topic' }
  return { ok: true }
}

function mentionsArea(normalized: string, settlements: SettlementKeywords[]): boolean {
  if (ZMIIV_STEMS.some((w) => normalized.includes(normalize(w)))) return true
  return detectSettlement(normalized, settlements) !== null
}

/** First settlement whose keyword stem appears in the text; villages win over the city. */
export function detectSettlement(text: string, settlements: SettlementKeywords[]): number | null {
  const t = normalize(text)
  let found: number | null = null
  for (const s of settlements) {
    if (s.keywords.some((k) => k && t.includes(normalize(k)))) {
      found = s.id
      // Keep scanning: a village mention is more specific than "Зміїв" (city is sorted first)
    }
  }
  return found
}
