'use client'

import { useActionState } from 'react'
import { recheckItems, saveFilters, saveSettlements, testFilters, type TestResult } from '../../_actions/filters'
import { AdminForm, Field, ResultNote, SubmitButton, type ActionResult } from '../../_ui'
import { Panel } from '../../_ui/Panel'

export function FiltersForm({ safety, noise, blockPhones }: { safety: string; noise: string; blockPhones: boolean }) {
  const [state, action] = useActionState<ActionResult, FormData>(saveFilters, null)
  return (
    <AdminForm action={action}>
      <Panel title="Стоп-слова">
        <div className="grid gap-5 min-[900px]:grid-cols-2">
          <Field label="Воєнна безпека" hint="Тривоги, обстріли, рух техніки. Такі новини не публікуються ніколи, навіть із перевірених джерел.">
            <textarea name="safety" defaultValue={safety} rows={12} className="adm-input resize-y font-mono text-sm" />
          </Field>
          <Field label="Реклама й особисті оголошення" hint="Продаж, оренда, вакансії, загублені речі. Одне слово або фраза на рядок; пробіл у кінці рядка означає кінець слова.">
            <textarea name="noise" defaultValue={noise} rows={12} className="adm-input resize-y font-mono text-sm" />
          </Field>
        </div>
        <label className="mt-4 flex gap-2.5">
          <input type="checkbox" name="block_phones" defaultChecked={blockPhones} className="mt-1 size-4 accent-serpent" />
          <span>
            <span className="font-medium">Відсіювати дописи з номерами телефонів</span>
            <span className="block text-[13px] text-muted">Номер у дописі майже завжди означає оголошення або особисті дані.</span>
          </span>
        </label>
      </Panel>
      <div className="mb-8 flex flex-wrap items-center gap-4">
        <SubmitButton>Зберегти фільтри</SubmitButton>
        <ResultNote state={state} />
      </div>
    </AdminForm>
  )
}

export function TestForm() {
  const [state, action] = useActionState<TestResult, FormData>(testFilters, null)
  return (
    <AdminForm action={action}>
      <Panel title="Перевірити текст">
        <div className="grid gap-3">
          <textarea name="text" rows={4} required placeholder="Вставте заголовок або допис" className="adm-input resize-y" />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="require_keyword" className="size-4 accent-serpent" />
            Як для джерела «лише про громаду»
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <SubmitButton className="adm-btn adm-btn-ghost" pending="Перевіряю…">
              Перевірити
            </SubmitButton>
            {state && (
              <span role="status" className="text-sm font-medium">
                {state.verdict}. {state.settlement ? `Село: ${state.settlement}.` : 'Село не визначено.'}
              </span>
            )}
          </div>
          <p className="text-[13px] text-muted">Перевіряє збережені правила. Спершу збережіть зміни у фільтрах.</p>
        </div>
      </Panel>
    </AdminForm>
  )
}

export function RecheckForm() {
  const [state, action] = useActionState<ActionResult, FormData>(recheckItems, null)
  return (
    <AdminForm action={action}>
      <Panel title="Застосувати до вже опублікованих">
        <p className="mb-4 text-[15px] text-muted">
          Нові стоп-слова діють лише на наступні збори. Ця кнопка перевірить стрічку й чергу зараз і прибере збіги. Закріплені новини не чіпає.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <SubmitButton className="adm-btn adm-btn-ghost" pending="Перевіряю…">
            Перевірити стрічку
          </SubmitButton>
          <ResultNote state={state} />
        </div>
      </Panel>
    </AdminForm>
  )
}

export function SettlementsForm({ settlements }: { settlements: { id: number; name: string; kind: string; keywords: string }[] }) {
  const [state, action] = useActionState<ActionResult, FormData>(saveSettlements, null)
  return (
    <AdminForm action={action}>
      <Panel title="Села й ключові слова">
        <p className="mb-4 text-[15px] text-muted">
          За цими словами новина отримує мітку села й потрапляє на мапу. Якщо згадано і місто, і село — перемагає село. Пишіть основу слова через кому
          («задонецьк» знайде «Задонецьке» і «Задонецькому»). Коротку основу, що збігається з іншими словами, краще записати повними формами.
        </p>
        <div className="grid gap-4">
          {settlements.map((s) => (
            <div key={s.id} className="grid gap-3 border-t-2 border-soft pt-4 min-[900px]:grid-cols-[220px_1fr]">
              <input type="hidden" name="settlement_id" value={s.id} />
              <Field label={s.kind === 'city' ? 'Місто' : 'Село'}>
                <input name={`name_${s.id}`} defaultValue={s.name} required className="adm-input" />
              </Field>
              <Field label="Ключові слова">
                <input name={`kw_${s.id}`} defaultValue={s.keywords.split(',').join(', ')} className="adm-input" />
              </Field>
            </div>
          ))}
        </div>
      </Panel>
      <div className="flex flex-wrap items-center gap-4">
        <SubmitButton>Зберегти села</SubmitButton>
        <ResultNote state={state} />
      </div>
    </AdminForm>
  )
}
