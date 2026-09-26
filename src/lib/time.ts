const TZ = 'Europe/Kyiv'

const dayKey = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(d)
const hm = (d: Date) => new Intl.DateTimeFormat('uk-UA', { timeZone: TZ, hour: '2-digit', minute: '2-digit' }).format(d)

/** "сьогодні, 09:40" / "вчора" / "2 дні тому" / "12 вересня". Input: UTC "YYYY-MM-DD HH:MM:SS". */
export function relativeDate(utc: string, now = new Date()): string {
  const d = new Date(utc.replace(' ', 'T') + 'Z')
  const days = Math.round((Date.parse(dayKey(now)) - Date.parse(dayKey(d))) / 86_400_000)
  if (days <= 0) return `сьогодні, ${hm(d)}`
  if (days === 1) return 'вчора'
  if (days < 5) return `${days} дні тому`
  return new Intl.DateTimeFormat('uk-UA', { timeZone: TZ, day: 'numeric', month: 'long' }).format(d)
}
