import Link from 'next/link'
import { knex } from '@/lib/knex'
import { relativeDate } from '@/lib/time'
import { moderateItems } from '../../_actions/news'
import { PageHead } from '../../_ui/Panel'
import { SettlementSelect } from './SettlementSelect'
import { CheckAll } from './CheckAll'

const PAGE_SIZE = 50

const STATUSES = [
  { id: 'pending', label: 'На перевірці' },
  { id: 'published', label: 'У стрічці' },
  { id: 'filtered', label: 'Відсіяні фільтрами' },
  { id: 'hidden', label: 'Приховані' },
] as const

const REASONS: Record<string, string> = {
  safety: 'воєнна безпека',
  noise: 'реклама / особисте',
  phone: 'номер телефону',
  off_topic: 'не про громаду',
}

function reasonLabel(raw: string | null): string | null {
  if (!raw) return null
  const [reason, match] = raw.split(':')
  return match ? `${REASONS[reason] ?? reason} («${match}»)` : (REASONS[reason] ?? reason)
}

type SP = Promise<{ status?: string; q?: string; source?: string; settlement?: string; reason?: string; page?: string }>

interface Row {
  id: number
  title: string
  excerpt: string | null
  url: string
  published_at: string
  status: string
  filter_reason: string | null
  pinned: number
  is_demo: number
  settlement_id: number | null
  source_name: string
}

export default async function NewsPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams
  const status = STATUSES.some((s) => s.id === sp.status) ? sp.status! : 'pending'
  const page = Math.max(1, Number(sp.page) || 1)

  const counts: { status: string; n: number }[] = await knex('items').select('status').count({ n: '*' }).groupBy('status')
  const [settlements, sources] = await Promise.all([
    knex('settlements').select('id', 'name').orderBy('sort_order') as Promise<{ id: number; name: string }[]>,
    knex('sources').select('id', 'name').orderBy('name') as Promise<{ id: number; name: string }[]>,
  ])

  const q = knex('items as i').join('sources as s', 's.id', 'i.source_id').where('i.status', status)
  if (sp.q) q.where((w) => w.where('i.title', 'like', `%${sp.q}%`).orWhere('i.excerpt', 'like', `%${sp.q}%`))
  if (sp.source) q.where('i.source_id', Number(sp.source))
  if (sp.settlement === 'none') q.whereNull('i.settlement_id')
  else if (sp.settlement) q.where('i.settlement_id', Number(sp.settlement))
  if (status === 'filtered' && sp.reason && sp.reason in REASONS) q.where('i.filter_reason', 'like', `${sp.reason}%`)

  const [{ total }] = await q.clone().count({ total: '*' })
  const rows: Row[] = await q
    .select('i.id', 'i.title', 'i.excerpt', 'i.url', 'i.published_at', 'i.status', 'i.filter_reason', 'i.pinned', 'i.is_demo', 'i.settlement_id', 's.name as source_name')
    .orderBy([
      { column: 'i.pinned', order: 'desc' },
      { column: 'i.published_at', order: 'desc' },
    ])
    .limit(PAGE_SIZE)
    .offset((page - 1) * PAGE_SIZE)
  const pages = Math.ceil(Number(total) / PAGE_SIZE)

  const href = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams()
    const merged = { status, q: sp.q, source: sp.source, settlement: sp.settlement, reason: sp.reason, ...patch }
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v)
    return `/admin/news?${p}`
  }
  const now = new Date()

  return (
    <>
      <PageHead
        title="Новини"
        lead="Що потрапить у стрічку. «На перевірці» — новини з джерел із премодерацією. «Відсіяні» — те, що зупинили стоп-слова: якщо фільтр помилився, опублікуйте вручну."
      />

      <nav className="mb-4 flex flex-wrap gap-2">
        {STATUSES.map((s) => {
          const n = Number(counts.find((c) => c.status === s.id)?.n ?? 0)
          return (
            <Link
              key={s.id}
              href={href({ status: s.id, reason: undefined, page: undefined })}
              aria-current={s.id === status ? 'page' : undefined}
              className={`rounded-full border-2 border-ink px-3.5 py-1 text-[15px] font-medium no-underline ${s.id === status ? 'bg-ink text-paper' : 'bg-white hover:bg-soft'}`}
            >
              {s.label} <span className="opacity-70">{n}</span>
            </Link>
          )
        })}
      </nav>

      <form className="mb-5 flex flex-wrap gap-2" action="/admin/news">
        <input type="hidden" name="status" value={status} />
        <input name="q" defaultValue={sp.q} placeholder="Пошук у заголовках" className="adm-input max-w-[280px]" />
        <select name="source" defaultValue={sp.source ?? ''} className="adm-input w-auto">
          <option value="">Усі джерела</option>
          {sources.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select name="settlement" defaultValue={sp.settlement ?? ''} className="adm-input w-auto">
          <option value="">Усі населені пункти</option>
          <option value="none">Без села</option>
          {settlements.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        {status === 'filtered' && (
          <select name="reason" defaultValue={sp.reason ?? ''} className="adm-input w-auto">
            <option value="">Усі причини</option>
            {Object.entries(REASONS).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>
        )}
        <button type="submit" className="adm-btn adm-btn-ghost">
          Показати
        </button>
      </form>

      {rows.length === 0 ? (
        <p className="rounded-[18px] border-2 border-dashed border-muted p-6 text-muted">
          {status === 'pending' ? 'Черга порожня: усі новини перевірені.' : 'Тут поки нічого немає. Змініть фільтр або вкладку.'}
        </p>
      ) : (
        <form action={moderateItems}>
          <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
            <CheckAll />
            <span className="text-muted">Позначені:</span>
            {status !== 'published' && (
              <button name="op" value="publish" className="adm-btn adm-btn-sm">
                Опублікувати
              </button>
            )}
            {status !== 'hidden' && (
              <button name="op" value="hide" className="adm-btn adm-btn-ghost adm-btn-sm">
                Приховати
              </button>
            )}
          </div>

          <ul className="grid gap-3">
            {rows.map((r) => (
              <li key={r.id} className={`grid grid-cols-[auto_1fr] gap-x-3 rounded-[18px] border-2 bg-white px-4 py-3.5 ${r.pinned ? 'border-ochre' : 'border-ink'}`}>
                <input type="checkbox" name="ids" value={r.id} aria-label={`Позначити: ${r.title}`} className="mt-1.5 size-4 accent-serpent" />
                <div className="min-w-0">
                  <a href={r.url} target="_blank" rel="noopener noreferrer" className="font-bold hover:underline">
                    {r.title}
                  </a>
                  {r.excerpt && r.excerpt !== r.title && <p className="mt-1 line-clamp-2 text-sm text-muted">{r.excerpt}</p>}
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-[13px]">
                    <span className="text-muted">
                      {r.source_name}, {relativeDate(r.published_at, now)}
                    </span>
                    {r.pinned ? <span className="rounded-full bg-ochre px-2 font-bold">закріплено</span> : null}
                    {r.is_demo ? <span className="rounded-full bg-soft px-2">демо</span> : null}
                    {r.filter_reason && <span className="font-bold text-brick">Фільтр: {reasonLabel(r.filter_reason)}</span>}
                    <SettlementSelect itemId={r.id} value={r.settlement_id} settlements={settlements} />
                    <span className="ml-auto flex flex-wrap gap-1.5">
                      {r.status !== 'published' && (
                        <button name="op" value={`publish:${r.id}`} className="adm-btn adm-btn-sm">
                          Опублікувати
                        </button>
                      )}
                      {r.status !== 'hidden' && (
                        <button name="op" value={`hide:${r.id}`} className="adm-btn adm-btn-ghost adm-btn-sm">
                          Приховати
                        </button>
                      )}
                      <button name="op" value={`${r.pinned ? 'unpin' : 'pin'}:${r.id}`} className="adm-btn adm-btn-ghost adm-btn-sm">
                        {r.pinned ? 'Відкріпити' : 'Закріпити вгорі'}
                      </button>
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </form>
      )}

      {pages > 1 && (
        <nav className="mt-6 flex flex-wrap gap-2" aria-label="Сторінки">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={href({ page: String(p) })}
              aria-current={p === page ? 'page' : undefined}
              className={`rounded-full border-2 border-ink px-3 no-underline ${p === page ? 'bg-ink text-paper' : 'bg-white'}`}
            >
              {p}
            </Link>
          ))}
        </nav>
      )}
    </>
  )
}
