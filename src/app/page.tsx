import { Explorer, type FeedCard } from '@/components/Explorer'
import { SerpentLine } from '@/components/SerpentLine'
import { getFeed, getPlaces, getRoutes, getSettlements } from '@/lib/db/queries'
import { getSiteSettings } from '@/lib/settings'
import { relativeDate } from '@/lib/time'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const [settlements, feed, routes, places, t] = await Promise.all([getSettlements(), getFeed(), getRoutes(), getPlaces(), getSiteSettings()])
  const contact = t.footer_contact
  const contactHref = contact.startsWith('@') ? `https://t.me/${contact.slice(1)}` : contact.includes('@') ? `mailto:${contact}` : contact
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
              {t.site_name}
            </a>
            <nav className="hidden gap-5.5 font-medium min-[600px]:flex">
              <a href="#feed" className="hover:text-brick">Новини</a>
              <a href="#routes" className="hover:text-brick">Маршрути</a>
              <a href="#places" className="hover:text-brick">Місця</a>
            </nav>
          </div>
        </header>

        <main className="mx-auto max-w-[1160px] px-5">
          <Explorer
            settlements={settlements}
            feed={cards}
            routes={routes}
            texts={{
              heroTitle: t.hero_title,
              heroLead: t.hero_lead,
              heroHint: t.hero_hint,
              feedTitle: t.sections_feed,
              routesTitle: t.sections_routes,
            }}
          />

          <section aria-labelledby="kruchi-h" className="mb-18">
            <div className="grid gap-10 rounded-[36px] bg-serpent px-7 py-11 text-paper min-[900px]:grid-cols-[1fr_1.3fr] min-[900px]:px-12 min-[900px]:py-16">
              <h2 id="kruchi-h" className="text-[clamp(30px,4.4vw,52px)] text-ochre">
                {t.story_title}
              </h2>
              <div>
                <p className="max-w-[52ch] text-lg">{t.story_p1}</p>
                {t.story_p2 && <p className="mt-3.5 max-w-[52ch] text-lg opacity-85">{t.story_p2}</p>}
              </div>
            </div>
          </section>

          {t.legend_text && (
            <section aria-labelledby="legend-h" className="mb-18">
              <div className="rounded-[28px] border-2 border-ink bg-soft px-7 py-9 min-[900px]:px-12">
                <h2 id="legend-h" className="mb-4 text-[clamp(24px,3.2vw,36px)]">
                  {t.legend_title}
                </h2>
                <p className="max-w-[60ch] text-lg">{t.legend_text}</p>
                {t.legend_note && <p className="mt-3 max-w-[60ch] text-sm text-muted">{t.legend_note}</p>}
              </div>
            </section>
          )}

          <section id="places" aria-labelledby="places-h" className="pb-20">
            <h2 id="places-h" className="mb-6 text-[clamp(28px,4vw,44px)]">
              {t.sections_places}
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
            <div>
              {t.site_name} {t.footer_about}
              {contact && (
                <>
                  {' '}
                  Надіслати новину:{' '}
                  <a href={contactHref} className="underline hover:text-ochre">
                    {contact}
                  </a>
                </>
              )}
            </div>
            <div>{t.footer_note}</div>
          </div>
        </footer>
      </div>
    </div>
  )
}
