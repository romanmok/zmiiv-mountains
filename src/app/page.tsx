import { Explorer, type FeedCard } from '@/components/Explorer'
import { SerpentLine } from '@/components/SerpentLine'
import { getFeed, getPlaces, getRoutes, getSettlements } from '@/lib/db/queries'
import { SITE_NAME } from '@/lib/site'
import { relativeDate } from '@/lib/time'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const [settlements, feed, routes, places] = await Promise.all([getSettlements(), getFeed(), getRoutes(), getPlaces()])
  const now = new Date()
  const cards: FeedCard[] = feed.map((i) => ({
    id: i.id,
    title: i.title,
    url: i.url,
    settlementId: i.settlement_id,
    sourceName: i.source_name,
    dateLabel: relativeDate(i.published_at, now),
    isDemo: i.is_demo,
  }))

  return (
    <div className="relative">
      <SerpentLine />

      <div className="relative z-10">
        <header className="mx-auto max-w-[1160px] px-5">
          <div className="flex h-19 items-center justify-between">
            <a href="/" className="font-display text-xl font-black text-serpent no-underline">
              {SITE_NAME}
            </a>
            <nav className="hidden gap-5.5 font-medium min-[600px]:flex">
              <a href="#feed" className="hover:text-brick">Новини</a>
              <a href="#routes" className="hover:text-brick">Маршрути</a>
              <a href="#places" className="hover:text-brick">Місця</a>
            </nav>
          </div>
        </header>

        <main className="mx-auto max-w-[1160px] px-5">
          <Explorer settlements={settlements} feed={cards} routes={routes} />

          <section aria-labelledby="kruchi-h" className="mb-18">
            <div className="grid gap-10 rounded-[36px] bg-serpent px-7 py-11 text-paper min-[900px]:grid-cols-[1fr_1.3fr] min-[900px]:px-12 min-[900px]:py-16">
              <h2 id="kruchi-h" className="text-[clamp(30px,4.4vw,52px)] text-ochre">
                Чому кручі білі
              </h2>
              <div>
                <p className="max-w-[52ch] text-lg">
                  Схили правого берега Дінця здаються крейдяними, але це чисті кварцові піски берекського регіоярусу.
                </p>
                <p className="mt-3.5 max-w-[52ch] text-lg opacity-85">
                  Справжня крейда виходить на поверхню найближче біля Геївки, на Шебелинці.
                </p>
              </div>
            </div>
          </section>

          <section id="places" aria-labelledby="places-h" className="pb-20">
            <h2 id="places-h" className="mb-6 text-[clamp(28px,4vw,44px)]">
              Місця, які варто побачити
            </h2>
            <ul className="grid gap-x-10 min-[600px]:grid-cols-2">
              {places.map((p) => (
                <li key={p.id} className="grid grid-cols-[1fr_auto] gap-x-5 gap-y-1 border-t-2 border-ink pt-4.5 pb-5.5">
                  <h3 className="text-[22px] font-bold">{p.name}</h3>
                  <span className="self-center text-sm font-bold text-brick">{p.kind}</span>
                  {p.description && <p className="col-span-full max-w-[48ch] text-base text-muted">{p.description}</p>}
                </li>
              ))}
            </ul>
          </section>
        </main>

        <footer className="bg-ink pt-10 pb-14 text-sm text-soft">
          <div className="mx-auto flex max-w-[1160px] flex-wrap justify-between gap-6 px-5">
            <div>{SITE_NAME} — незалежний вебресурс про Зміївську громаду.</div>
            <div>Новини — заголовки й посилання на джерела. Мапа схематична. © учасники OpenStreetMap.</div>
          </div>
        </footer>
      </div>
    </div>
  )
}
