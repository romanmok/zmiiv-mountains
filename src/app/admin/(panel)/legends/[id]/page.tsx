import Link from 'next/link'
import { notFound } from 'next/navigation'
import { knex } from '@/lib/knex'
import { PageHead } from '../../../_ui/Panel'
import { LegendForm, type LegendValues } from './LegendForm'

export default async function LegendEditPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  const { id } = await params
  const { created } = await searchParams
  const settlements: { id: number; name: string }[] = await knex('settlements').select('id', 'name').orderBy('sort_order')

  let legend: LegendValues | null = null
  if (id !== 'new') {
    legend = await knex('legends').where({ id: Number(id) }).first()
    if (!legend) notFound()
  }

  return (
    <>
      <p className="mb-2 text-sm">
        <Link href="/admin/legends" className="text-muted hover:text-brick">
          Усі легенди
        </Link>
      </p>
      <PageHead title={legend ? legend.title : 'Нова легенда'} />
      <LegendForm legend={legend} settlements={settlements} created={Boolean(created)} />
    </>
  )
}
