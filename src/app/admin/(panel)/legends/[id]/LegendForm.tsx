'use client'

import { useActionState } from 'react'
import { deleteLegend, saveLegend } from '../../../_actions/legends'
import { AdminForm, ConfirmButton, Field, ResultNote, SubmitButton, type ActionResult } from '../../../_ui'
import { Panel } from '../../../_ui/Panel'

export interface LegendValues {
  id: number
  title: string
  body: string
  note: string | null
  settlement_id: number | null
  source_url: string | null
  is_published: number | boolean
}

export function LegendForm({ legend, settlements, created }: { legend: LegendValues | null; settlements: { id: number; name: string }[]; created: boolean }) {
  const [state, action] = useActionState<ActionResult, FormData>(saveLegend, created ? { ok: true, message: 'Легенду додано.' } : null)

  return (
    <>
      <AdminForm action={action}>
        {legend && <input type="hidden" name="id" value={legend.id} />}
        <Panel>
          <div className="grid gap-4">
            <Field label="Заголовок">
              <input name="title" defaultValue={legend?.title} required className="adm-input" />
            </Field>
            <Field label="Текст легенди" hint="Своїми словами, 2–4 речення.">
              <textarea name="body" defaultValue={legend?.body} required rows={6} className="adm-input" />
            </Field>
            <Field label="Примітка під легендою" hint="Що кажуть історики, щоб легенду не прийняли за факт. Можна лишити порожньою.">
              <textarea name="note" defaultValue={legend?.note ?? ''} rows={2} className="adm-input" />
            </Field>
            <div className="grid gap-4 min-[900px]:grid-cols-2">
              <Field label="Село">
                <select name="settlement_id" defaultValue={legend?.settlement_id ?? ''} className="adm-input">
                  <option value="">Без села</option>
                  {settlements.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Джерело" hint="Посилання, де записано переказ. На сайті не показується.">
                <input name="source_url" defaultValue={legend?.source_url ?? ''} className="adm-input" />
              </Field>
            </div>
            <label className="flex gap-2.5">
              <input type="checkbox" name="is_published" defaultChecked={legend ? Boolean(legend.is_published) : true} className="mt-1 size-4 accent-serpent" />
              <span className="font-medium">Показувати на сайті</span>
            </label>
          </div>
        </Panel>
        <div className="flex flex-wrap items-center gap-4">
          <SubmitButton>{legend ? 'Зберегти легенду' : 'Додати легенду'}</SubmitButton>
          <ResultNote state={state} />
        </div>
      </AdminForm>

      {legend && (
        <form action={deleteLegend} className="mt-8 border-t-2 border-ink pt-6">
          <input type="hidden" name="id" value={legend.id} />
          <ConfirmButton message={`Видалити легенду «${legend.title}»? Щоб лише прибрати з сайту, зніміть «Показувати на сайті».`}>Видалити легенду</ConfirmButton>
        </form>
      )}
    </>
  )
}
