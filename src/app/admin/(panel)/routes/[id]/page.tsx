import Link from 'next/link'
import { notFound } from 'next/navigation'
import { knex } from '@/lib/knex'
import { PageHead } from '../../../_ui/Panel'
import { RouteForm, type RouteValues } from './RouteForm'

export default async function RouteEditPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  const { id } = await params
  const { created } = await searchParams
  const settlements: { id: number; name: string }[] = await knex('settlements').select('id', 'name').orderBy('sort_order')
  let route: RouteValues | null = null
  if (id !== 'new') {
    route = await knex('routes').where({ id: Number(id) }).first()
    if (!route) notFound()
  }
  return (
    <>
      <p className="mb-2 text-sm">
        <Link href="/admin/routes" className="text-muted hover:text-brick">
          Усі маршрути
        </Link>
      </p>
      <PageHead title={route ? route.title : 'Новий маршрут'} />
      <RouteForm route={route} settlements={settlements} created={Boolean(created)} />
    </>
  )
}
