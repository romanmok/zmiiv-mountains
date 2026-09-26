import { knex } from '@/lib/knex'
import { loadFilterRules } from '@/lib/collectors'
import { PageHead } from '../../_ui/Panel'
import { FiltersForm, RecheckForm, SettlementsForm, TestForm } from './FiltersForms'

export default async function FiltersPage() {
  const rules = await loadFilterRules()
  const settlements: { id: number; name: string; kind: string; keywords: string }[] = await knex('settlements')
    .select('id', 'name', 'kind', 'keywords')
    .orderBy('sort_order')
  return (
    <>
      <PageHead
        title="Фільтри"
        lead="Кожну нову новину збирач перевіряє за цими правилами. Слово спрацьовує як частина слова: «ракет» зупинить і «ракета», і «ракетний». Регістр не важливий."
      />
      <FiltersForm safety={rules.safety.join('\n')} noise={rules.noise.join('\n')} blockPhones={rules.blockPhones} />
      <div className="grid gap-6 min-[900px]:grid-cols-2">
        <TestForm />
        <RecheckForm />
      </div>
      <SettlementsForm settlements={settlements} />
    </>
  )
}
