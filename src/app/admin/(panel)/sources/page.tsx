import Link from 'next/link'
import { knex } from '@/lib/knex'
import { relativeDate } from '@/lib/time'
import { toggleSource } from '../../_actions/sources'
import { PageHead } from '../../_ui/Panel'

const TYPE_LABEL = { rss: 'RSS', telegram: 'Telegram', youtube: 'YouTube' } as const

interface Row {
  id: number
  name: string
  type: keyof typeof TYPE_LABEL
  enabled: number
  require_keyword: number
  premoderate: number
  last_fetched_at: string | null
  last_error: string | null
  settlement: string | null
  published: number
  total: number
}

export default async function SourcesPage() {
  const rows: Row[] = await knex('sources as s')
    .leftJoin('settlements as st', 'st.id', 's.default_settlement_id')
    .leftJoin('items as i', 'i.source_id', 's.id')
    .groupBy('s.id')
    .select('s.id', 's.name', 's.type', 's.enabled', 's.require_keyword', 's.premoderate', 's.last_fetched_at', 's.last_error', 'st.name as settlement')
    .select(knex.raw("SUM(i.status = 'published') as published"), knex.raw('COUNT(i.id) as total'))
    .orderBy([{ column: 's.enabled', order: 'desc' }, 's.name'])
  const now = new Date()

  return (
    <>
      <PageHead title="Джерела" lead="Звідки збирач бере новини кожні 30 хвилин. Вимкнене джерело не опитується, але його новини лишаються в стрічці.">
        <Link href="/admin/sources/new" className="adm-btn no-underline">
          Додати джерело
        </Link>
      </PageHead>
      <ul className="grid gap-3">
        {rows.map((s) => (
          <li key={s.id} className={`flex flex-wrap items-center gap-x-5 gap-y-2 rounded-[18px] border-2 border-ink px-5 py-3.5 ${s.enabled ? 'bg-white' : 'bg-soft'}`}>
            <div className="min-w-[240px] flex-1">
              <Link href={`/admin/sources/${s.id}`} className="font-bold hover:text-brick">
                {s.name}
              </Link>
              <div className="mt-1 flex flex-wrap gap-x-3 text-[13px] text-muted">
                <span>{TYPE_LABEL[s.type]}</span>
                {s.settlement && <span>{s.settlement}</span>}
                {s.require_keyword ? <span>лише про громаду</span> : null}
                {s.premoderate ? <span>премодерація</span> : null}
                <span>
                  у стрічці {Number(s.published)} з {Number(s.total)}
                </span>
                <span>{s.last_fetched_at ? `зібрано ${relativeDate(s.last_fetched_at, now)}` : 'ще не збиралося'}</span>
              </div>
              {s.last_error && <p className="mt-1 text-[13px] font-medium text-brick">Помилка: {s.last_error}</p>}
            </div>
            <form action={toggleSource}>
              <input type="hidden" name="id" value={s.id} />
              <button type="submit" className={`adm-btn adm-btn-sm ${s.enabled ? 'adm-btn-ghost' : ''}`}>
                {s.enabled ? 'Вимкнути' : 'Увімкнути'}
              </button>
            </form>
          </li>
        ))}
      </ul>
    </>
  )
}
