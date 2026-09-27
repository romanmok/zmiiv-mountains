import Link from 'next/link'
import { knex } from '@/lib/knex'
import { PageHead } from '../../_ui/Panel'

interface Row {
  id: number
  title: string
  is_published: number
  settlement: string | null
}

export default async function LegendsPage() {
  const rows: Row[] = await knex('legends as l')
    .leftJoin('settlements as s', 's.id', 'l.settlement_id')
    .select('l.id', 'l.title', 'l.is_published', 's.name as settlement')
    .orderBy('l.id')

  return (
    <>
      <PageHead title="Легенди" lead="На головній після зеленого блоку показується одна опублікована легенда, щоразу випадкова.">
        <Link href="/admin/legends/new" className="adm-btn no-underline">
          Додати легенду
        </Link>
      </PageHead>
      {rows.length === 0 ? (
        <p className="rounded-[18px] border-2 border-dashed border-muted p-6 text-muted">Легенд ще немає. Поки жодна не опублікована, блок на сайті не показується.</p>
      ) : (
        <ul className="grid gap-3">
          {rows.map((r) => (
            <li key={r.id} className={`rounded-[18px] border-2 border-ink px-5 py-3.5 ${r.is_published ? 'bg-white' : 'bg-soft'}`}>
              <Link href={`/admin/legends/${r.id}`} className="font-bold hover:text-brick">
                {r.title}
              </Link>
              <div className="mt-1 flex flex-wrap gap-x-3 text-[13px] text-muted">
                <span>{r.settlement ?? 'без села'}</span>
                {!r.is_published && <span>чернетка</span>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
