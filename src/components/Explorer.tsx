'use client'

import { useRef, useState, useTransition } from 'react'
import { loadFeed } from '@/app/feed-actions'
import type { Route, Settlement } from '@/lib/db/types'
import { VillageMap } from './VillageMap'

export interface FeedCard {
  id: number
  title: string
  url: string
  settlementId: number | null
  sourceName: string
  dateLabel: string
  isDemo: boolean
}

export interface ExplorerTexts {
  heroTitle: string
  heroLead: string
  heroHint: string
  feedTitle: string
  routesTitle: string
}

interface FeedPage {
  items: FeedCard[]
  hasMore: boolean
}

interface Props {
  settlements: Settlement[]
  /** First page for "all settlements"; further pages and per-settlement pages come from loadFeed */
  feed: FeedPage
  routes: Route[]
  texts: ExplorerTexts
}

const ROUTE_KIND: Record<Route['kind'], string> = {
  hike: 'Піший',
  eco_trail: 'Екостежка',
  bike: 'Велосипедний',
  water: 'Водний',
}

function routeMeta(r: Route): string | null {
  const parts = [r.length_km ? `${Number(r.length_km).toLocaleString('uk-UA')} км` : null, r.elevation_m ? `набір ${r.elevation_m} м` : null]
  const meta = parts.filter(Boolean).join(', ')
  return meta || null
}

/** Map + feed + routes: selecting a settlement filters both lists. */
export function Explorer({ settlements, feed, routes, texts }: Props) {
  const [selected, setSelected] = useState<number | null>(null)
  const [page, setPage] = useState<FeedPage>(feed)
  const [pending, startTransition] = useTransition()
  // Latest selection, so a slow response for a previously clicked village never overwrites the list
  const selectedRef = useRef<number | null>(null)
  const byId = new Map(settlements.map((s) => [s.id, s]))
  const current = selected ? byId.get(selected) : undefined

  const items = page.items
  const shownRoutes = selected ? routes.filter((r) => r.settlement_id === selected) : routes
  const hasDemo = feed.items.some((i) => i.isDemo)

  function fetchPage(settlementId: number | null, offset: number) {
    startTransition(async () => {
      const next = await loadFeed(offset, settlementId)
      if (selectedRef.current !== settlementId) return
      setPage((prev) => (offset ? { items: [...prev.items, ...next.items], hasMore: next.hasMore } : next))
    })
  }

  function select(id: number | null) {
    selectedRef.current = id
    setSelected(id)
    if (id === null) setPage(feed)
    else fetchPage(id, 0)
  }

  return (
    <>
      <div className="grid items-center gap-10 pt-6 pb-16 min-[900px]:grid-cols-[1fr_1.1fr]">
        <div>
          <h1 className="text-[clamp(44px,7vw,96px)] font-black text-serpent">{texts.heroTitle}</h1>
          {texts.heroLead && <p className="mt-5 max-w-[40ch] text-[19px]">{texts.heroLead}</p>}
          {texts.heroHint && <p className="mt-4 text-[15px] text-muted">{texts.heroHint}</p>}
        </div>
        <VillageMap settlements={settlements} selected={selected} onSelect={select} />
      </div>

      <section id="feed" aria-labelledby="feed-h" className="pt-10 pb-18">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-5">
          <h2 id="feed-h" className="text-[clamp(28px,4vw,44px)]">
            {texts.feedTitle}
          </h2>
          <div className="text-[15px] text-muted" aria-live="polite">
            {current ? (
              <>
                Показано: {current.name}
                <button
                  type="button"
                  onClick={() => select(null)}
                  className="ml-1.5 cursor-pointer text-brick underline"
                >
                  Показати всі
                </button>
              </>
            ) : (
              'Показано всі населені пункти'
            )}
          </div>
        </div>
        {hasDemo && <p className="mb-3.5 text-[13px] text-muted">Демо-стрічка: джерела справжні, заголовки умовні.</p>}
        {items.length > 0 ? (
          <ul
            aria-busy={pending}
            className={`grid gap-4 transition-opacity min-[600px]:grid-cols-2 min-[900px]:grid-cols-3 ${pending ? 'opacity-60' : ''}`}
          >
            {items.map((i) => {
              const place = i.settlementId ? byId.get(i.settlementId) : undefined
              return (
                <li key={i.id} className="flex flex-col gap-2.5 rounded-[18px] border-2 border-ink bg-white px-5 py-4.5">
                  {place && <span className="self-start rounded-full bg-ochre px-2.5 py-0.5 text-[13px] font-bold">{place.name}</span>}
                  <h3 className="font-sans text-lg leading-[1.35] font-bold tracking-normal">
                    <a href={i.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {i.title}
                    </a>
                  </h3>
                  <div className="mt-auto text-sm text-muted">
                    {i.sourceName}, {i.dateLabel}
                  </div>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="rounded-[18px] border-2 border-dashed border-muted p-6 text-muted">
            {pending ? 'Завантажую новини…' : 'Для цього села поки немає новин. Оберіть інше на мапі або покажіть усі.'}
          </p>
        )}
        {page.hasMore && (
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              disabled={pending}
              onClick={() => fetchPage(selected, items.length)}
              className="cursor-pointer rounded-full border-2 border-ink bg-white px-6 py-2.5 font-bold hover:bg-ochre disabled:cursor-wait disabled:opacity-60"
            >
              {pending ? 'Завантажую…' : 'Показати ще'}
            </button>
          </div>
        )}
      </section>

      <section id="routes" aria-labelledby="routes-h" className="pb-18">
        <h2 id="routes-h" className="mb-6 text-[clamp(28px,4vw,44px)]">
          {current ? `${texts.routesTitle}: ${current.name}` : texts.routesTitle}
        </h2>
        {shownRoutes.length > 0 ? (
          <ul className="grid gap-x-10 min-[600px]:grid-cols-2">
            {shownRoutes.map((r) => (
              <li key={r.id} className="grid grid-cols-[1fr_auto] gap-x-5 gap-y-1 border-t-2 border-ink pt-4.5 pb-5.5">
                <h3 className="text-[22px] font-bold">{r.title}</h3>
                <span className="self-center text-sm font-bold text-brick">{ROUTE_KIND[r.kind]}</span>
                {routeMeta(r) && <p className="col-span-full text-[15px] font-medium">{routeMeta(r)}</p>}
                {r.description && <p className="col-span-full max-w-[48ch] text-base text-muted">{r.description}</p>}
                {r.source_url && (
                  <a href={r.source_url} target="_blank" rel="noopener noreferrer" className="col-span-full text-[15px] font-medium underline hover:text-brick">
                    Докладніше про маршрут
                  </a>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-[18px] border-2 border-dashed border-muted p-6 text-muted">
            Біля цього села маршрутів поки немає. Оберіть інше на мапі або покажіть усі.
          </p>
        )}
      </section>
    </>
  )
}
