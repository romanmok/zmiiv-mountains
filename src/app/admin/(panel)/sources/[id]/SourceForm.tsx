'use client'

import { useActionState, useState } from 'react'
import { collectSource, deleteSource, saveSource } from '../../../_actions/sources'
import { AdminForm, ConfirmButton, Field, ResultNote, SubmitButton, type ActionResult } from '../../../_ui'
import { Panel } from '../../../_ui/Panel'

export interface SourceValues {
  id: number
  name: string
  type: 'rss' | 'telegram' | 'youtube'
  url: string
  site_url: string | null
  enabled: number | boolean
  require_keyword: number | boolean
  premoderate: number | boolean
  default_settlement_id: number | null
  last_error: string | null
}

const URL_HINT = {
  rss: 'Адреса RSS/Atom-стрічки сайту, зазвичай …/feed/ або …/rss.',
  telegram: 'Лише публічні канали: @назва або https://t.me/назва. Збирач читає веб-версію t.me/s/назва.',
  youtube: 'Посилання на канал виду youtube.com/channel/UC… — перетвориться на RSS каналу.',
}

export function SourceForm({ source, settlements, created }: { source: SourceValues | null; settlements: { id: number; name: string }[]; created: boolean }) {
  const [state, action] = useActionState<ActionResult, FormData>(saveSource, created ? { ok: true, message: 'Джерело додано. Спробуйте «Зібрати зараз».' } : null)
  const [collectState, collect] = useActionState<ActionResult, FormData>(collectSource, null)
  const [type, setType] = useState<SourceValues['type']>(source?.type ?? 'rss')
  const url = source?.type === 'telegram' ? `@${source.url}` : source?.url

  return (
    <>
      <AdminForm action={action}>
        {source && <input type="hidden" name="id" value={source.id} />}
        <Panel>
          <div className="grid gap-4 min-[900px]:grid-cols-2">
            <Field label="Назва" hint="Показується під новиною в стрічці.">
              <input name="name" defaultValue={source?.name} required className="adm-input" />
            </Field>
            <Field label="Тип">
              <select name="type" value={type} onChange={(e) => setType(e.target.value as SourceValues['type'])} className="adm-input">
                <option value="rss">Сайт (RSS)</option>
                <option value="telegram">Telegram-канал</option>
                <option value="youtube">YouTube-канал</option>
              </select>
            </Field>
            <Field label="Стрічка / канал" hint={URL_HINT[type]}>
              <input name="url" defaultValue={url} required className="adm-input" />
            </Field>
            <Field label="Сайт джерела" hint="Необовʼязково. Для Telegram заповниться сам.">
              <input name="site_url" defaultValue={source?.site_url ?? ''} className="adm-input" />
            </Field>
            <Field label="Село за замовчуванням" hint="Якщо в тексті не знайдено жодного села.">
              <select name="default_settlement_id" defaultValue={source?.default_settlement_id ?? ''} className="adm-input">
                <option value="">Не призначати</option>
                {settlements.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="mt-5 grid gap-3">
            <Check name="enabled" defaultChecked={source ? Boolean(source.enabled) : true} label="Опитувати джерело" />
            <Check
              name="require_keyword"
              defaultChecked={Boolean(source?.require_keyword)}
              label="Лише новини, де згадано Зміїв або село громади"
              hint="Для районних і обласних джерел, які пишуть не лише про громаду."
            />
            <Check
              name="premoderate"
              defaultChecked={Boolean(source?.premoderate)}
              label="Премодерація"
              hint="Нові новини чекають на перевірку у вкладці «На перевірці» і не зʼявляються на сайті самі."
            />
          </div>
        </Panel>
        <div className="flex flex-wrap items-center gap-4">
          <SubmitButton>{source ? 'Зберегти джерело' : 'Додати джерело'}</SubmitButton>
          <ResultNote state={state} />
        </div>
      </AdminForm>

      {source && (
        <div className="mt-8 flex flex-wrap items-start gap-6 border-t-2 border-ink pt-6">
          <AdminForm action={collect} className="flex flex-wrap items-center gap-3">
            <input type="hidden" name="id" value={source.id} />
            <SubmitButton className="adm-btn adm-btn-ghost" pending="Збираю…">
              Зібрати зараз
            </SubmitButton>
            <ResultNote state={collectState} />
          </AdminForm>
          <form action={deleteSource} className="ml-auto">
            <input type="hidden" name="id" value={source.id} />
            <ConfirmButton message={`Видалити «${source.name}» разом з усіма його новинами? Щоб лише зупинити збір, вимкніть джерело.`}>
              Видалити джерело
            </ConfirmButton>
          </form>
        </div>
      )}
    </>
  )
}

function Check({ name, label, hint, defaultChecked }: { name: string; label: string; hint?: string; defaultChecked: boolean }) {
  return (
    <label className="flex gap-2.5">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="mt-1 size-4 accent-serpent" />
      <span>
        <span className="font-medium">{label}</span>
        {hint && <span className="block text-[13px] text-muted">{hint}</span>}
      </span>
    </label>
  )
}
