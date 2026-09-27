import Link from 'next/link'
import { knex } from '@/lib/knex'
import { moveRoute } from '../../_actions/routes'
import { PageHead } from '../../_ui/Panel'
import { ROUTE_KIND } from '@/lib/route-kind'

interface Row {
  id: number
  title: string
  kind: keyof typeof ROUTE_KIND
  length_km: string | null
  elevation_m: number | null
  is_published: number
  settlement: string | null
}

export default async function RoutesPage() {
  const rows: Row[] = await knex('routes as r')
    .leftJoin('settlements as s', 's.id', 'r.settlement_id')
    .select('r.id', 'r.title', 'r.kind', 'r.length_km', 'r.elevation_m', 'r.is_published', 's.name as settlement')
    .orderBy([{ column: 'r.sort_order' }, { column: 'r.id' }])

  return (
    <>
      <PageHead title="Маршрути" lead="Показуються на головній під стрічкою у цьому порядку. Натискання на село на мапі лишає тільки його маршрути.">
        <Link href="/admin/routes/new" className="adm-btn no-underline">
          Додати маршрут
        </Link>
      </PageHead>
      {rows.length === 0 ? (
        <p className="rounded-[18px] border-2 border-dashed border-muted p-6 text-muted">Маршрутів ще немає. Додайте перший.</p>
      ) : (
        <ul className="grid gap-3">
          {rows.map((r, i) => (
            <li key={r.id} className={`flex flex-wrap items-center gap-x-5 gap-y-2 rounded-[18px] border-2 border-ink px-5 py-3.5 ${r.is_published ? 'bg-white' : 'bg-soft'}`}>
              <div className="min-w-[240px] flex-1">
                <Link href={`/admin/routes/${r.id}`} className="font-bold hover:text-brick">
                  {r.title}
                </Link>
                <div className="mt-1 flex flex-wrap gap-x-3 text-[13px] text-muted">
                  <span className="font-bold text-brick">{ROUTE_KIND[r.kind]}</span>
                  <span>{r.settlement ?? 'без села'}</span>
                  {r.length_km && <span>{Number(r.length_km).toLocaleString('uk-UA')} км</span>}
                  {r.elevation_m ? <span>набір {r.elevation_m} м</span> : null}
                  {!r.is_published && <span>чернетка</span>}
                </div>
              </div>
              <form action={moveRoute} className="flex gap-1.5">
                <input type="hidden" name="id" value={r.id} />
                <button name="dir" value="up" disabled={i === 0} className="adm-btn adm-btn-ghost adm-btn-sm" aria-label={`Вище: ${r.title}`}>
                  Вище
                </button>
                <button name="dir" value="down" disabled={i === rows.length - 1} className="adm-btn adm-btn-ghost adm-btn-sm" aria-label={`Нижче: ${r.title}`}>
                  Нижче
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
