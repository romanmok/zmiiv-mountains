import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import { SiteFooter, SiteHeader } from '@/components/SiteChrome'
import { getRouteBySlug } from '@/lib/db/queries'
import { firstImage, renderRouteBody } from '@/lib/route-body'
import { getSiteSettings } from '@/lib/settings'
import { ROUTE_KIND } from '@/lib/route-kind'

export const dynamic = 'force-dynamic'

const load = cache((slug: string) => getRouteBySlug(slug))

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const r = await load((await params).slug)
  if (!r) return {}
  const image = r.cover_url ?? firstImage(r.body)
  return {
    title: r.title,
    description: r.description ?? undefined,
    alternates: { canonical: `/routes/${r.slug}` },
    openGraph: { type: 'article', title: r.title, description: r.description ?? undefined, url: `/routes/${r.slug}`, images: image ? [image] : undefined },
  }
}

export default async function RoutePage({ params }: { params: Promise<{ slug: string }> }) {
  const [r, t] = await Promise.all([load((await params).slug), getSiteSettings()])
  if (!r) notFound()
  const body = renderRouteBody(r.body)
  const facts = [
    r.length_km && { label: 'Довжина', value: `${Number(r.length_km).toLocaleString('uk-UA')} км` },
    r.elevation_m && { label: 'Набір висоти', value: `${r.elevation_m} м` },
    r.settlement_name && { label: 'Поруч', value: r.settlement_name },
  ].filter(Boolean) as { label: string; value: string }[]

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader t={t} />
      <main className="mx-auto w-full max-w-[1160px] flex-1 px-5 pb-20">
        <a href="/#routes" className="text-[15px] font-medium text-muted hover:text-brick">
          Усі маршрути
        </a>

        <header className="mt-5 mb-8 max-w-[860px]">
          <p className="mb-3 inline-block rounded-full border-2 border-brick px-3 py-0.5 text-sm font-bold text-brick">{ROUTE_KIND[r.kind]}</p>
          <h1 className="text-[clamp(32px,5.4vw,60px)] leading-[1.05] font-black text-serpent">{r.title}</h1>
          {facts.length > 0 && (
            <dl className="mt-6 flex flex-wrap gap-x-9 gap-y-3">
              {facts.map((f) => (
                <div key={f.label}>
                  <dt className="text-sm text-muted">{f.label}</dt>
                  <dd className="font-display text-[22px] font-bold">{f.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </header>

        {r.cover_url && <img src={r.cover_url} alt="" className="mb-10 aspect-[16/9] w-full rounded-[28px] border-2 border-ink object-cover min-[900px]:aspect-[21/9]" />}

        <article className="max-w-[720px]">
          {r.description && <p className="mb-8 text-[21px] leading-normal font-medium">{r.description}</p>}
          {body ? <div className="route-body" dangerouslySetInnerHTML={{ __html: body }} /> : !r.description && <p className="text-muted">Опис маршруту готується.</p>}
          {r.source_url && (
            <p className="mt-10 border-t-2 border-ink pt-5 text-[15px]">
              Джерело або трек:{' '}
              <a href={r.source_url} target="_blank" rel="noopener noreferrer" className="font-medium break-all underline hover:text-brick">
                {r.source_url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
              </a>
            </p>
          )}
        </article>
      </main>
      <SiteFooter t={t} />
    </div>
  )
}
