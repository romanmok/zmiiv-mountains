import Link from 'next/link'
import { knex } from '@/lib/knex'
import { PageHead, Panel } from '../_ui/Panel'
import { relativeDate } from '@/lib/time'

export default async function AdminHome() {
  const byStatus: { status: string; n: number }[] = await knex('items').select('status').count({ n: '*' }).groupBy('status')
  const count = (s: string) => Number(byStatus.find((r) => r.status === s)?.n ?? 0)
  const broken: { id: number; name: string; last_error: string; last_fetched_at: string | null }[] = await knex('sources')
    .where({ enabled: true })
    .whereNotNull('last_error')
    .select('id', 'name', 'last_error', 'last_fetched_at')
  const [{ last }] = await knex('sources').max({ last: 'last_fetched_at' })

  const tiles = [
    { href: '/admin/news?status=pending', n: count('pending'), label: 'чекають на перевірку' },
    { href: '/admin/news?status=published', n: count('published'), label: 'у стрічці' },
    { href: '/admin/news?status=filtered', n: count('filtered'), label: 'відсіяли фільтри' },
    { href: '/admin/news?status=hidden', n: count('hidden'), label: 'приховано вручну' },
  ]

  return (
    <>
      <PageHead title="Огляд" lead={last ? `Останній збір новин: ${relativeDate(last)}.` : 'Збирач новин ще не запускався.'} />
      <ul className="mb-6 grid gap-4 min-[600px]:grid-cols-2 min-[900px]:grid-cols-4">
        {tiles.map((t) => (
          <li key={t.href}>
            <Link href={t.href} className="block rounded-[18px] border-2 border-ink bg-white px-5 py-4 no-underline hover:bg-soft">
              <span className="block font-display text-3xl font-black text-serpent">{t.n}</span>
              <span className="text-[15px]">{t.label}</span>
            </Link>
          </li>
        ))}
      </ul>
      {broken.length > 0 && (
        <Panel title="Джерела з помилками">
          <ul className="grid gap-2">
            {broken.map((s) => (
              <li key={s.id}>
                <Link href={`/admin/sources/${s.id}`} className="font-bold hover:text-brick">
                  {s.name}
                </Link>
                <span className="text-sm text-muted"> {s.last_error}</span>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </>
  )
}
