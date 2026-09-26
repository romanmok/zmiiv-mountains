import Link from 'next/link'
import { notFound } from 'next/navigation'
import { knex } from '@/lib/knex'
import { PageHead } from '../../../_ui/Panel'
import { SourceForm, type SourceValues } from './SourceForm'

export default async function SourceEditPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  const { id } = await params
  const { created } = await searchParams
  const settlements: { id: number; name: string }[] = await knex('settlements').select('id', 'name').orderBy('sort_order')

  let source: SourceValues | null = null
  if (id !== 'new') {
    source = await knex('sources').where({ id: Number(id) }).first()
    if (!source) notFound()
  }

  return (
    <>
      <p className="mb-2 text-sm">
        <Link href="/admin/sources" className="text-muted hover:text-brick">
          Усі джерела
        </Link>
      </p>
      <PageHead title={source ? source.name : 'Нове джерело'} />
      <SourceForm source={source} settlements={settlements} created={Boolean(created)} />
    </>
  )
}
