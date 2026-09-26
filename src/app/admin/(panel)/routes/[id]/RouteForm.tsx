'use client'

import { useActionState } from 'react'
import { deleteRoute, saveRoute } from '../../../_actions/routes'
import { AdminForm, ConfirmButton, Field, ResultNote, SubmitButton, type ActionResult } from '../../../_ui'
import { Panel } from '../../../_ui/Panel'
import { ROUTE_KIND } from '../kinds'

export interface RouteValues {
  id: number
  slug: string
  title: string
  kind: keyof typeof ROUTE_KIND
  settlement_id: number | null
  length_km: string | null
  elevation_m: number | null
  description: string | null
  source_url: string | null
  is_published: number | boolean
  sort_order: number
}

export function RouteForm({ route, settlements, created }: { route: RouteValues | null; settlements: { id: number; name: string }[]; created: boolean }) {
  const [state, action] = useActionState<ActionResult, FormData>(saveRoute, created ? { ok: true, message: 'Маршрут додано.' } : null)
  return (
    <>
      <AdminForm action={action}>
        {route && <input type="hidden" name="id" value={route.id} />}
        <input type="hidden" name="sort_order" value={route?.sort_order ?? 999} />
        <Panel>
          <div className="grid gap-4 min-[900px]:grid-cols-2">
            <Field label="Назва">
              <input name="title" defaultValue={route?.title} required className="adm-input" />
            </Field>
            <Field label="Адреса (латиницею)" hint="Порожнє поле — складеться з назви.">
              <input name="slug" defaultValue={route?.slug} className="adm-input" />
            </Field>
            <Field label="Тип">
              <select name="kind" defaultValue={route?.kind ?? 'hike'} className="adm-input">
                {Object.entries(ROUTE_KIND).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Біля якого села" hint="Маршрут показується, коли на мапі обрано це село.">
              <select name="settlement_id" defaultValue={route?.settlement_id ?? ''} className="adm-input">
                <option value="">Не привʼязувати</option>
                {settlements.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Довжина, км" hint="Можна порожнім, якщо невідомо.">
              <input name="length_km" inputMode="decimal" defaultValue={route?.length_km ? Number(route.length_km).toLocaleString('uk-UA') : ''} className="adm-input" />
            </Field>
            <Field label="Набір висоти, м">
              <input name="elevation_m" inputMode="numeric" defaultValue={route?.elevation_m ?? ''} className="adm-input" />
            </Field>
          </div>
          <div className="mt-4 grid gap-4">
            <Field label="Опис" hint="Одне-два речення: що побачите і чим маршрут особливий.">
              <textarea name="description" defaultValue={route?.description ?? ''} rows={4} className="adm-input resize-y" />
            </Field>
            <Field label="Джерело або трек" hint="Посилання на опис, трек чи сторінку нацпарку.">
              <input name="source_url" defaultValue={route?.source_url ?? ''} className="adm-input" />
            </Field>
            <label className="flex gap-2.5">
              <input type="checkbox" name="is_published" defaultChecked={route ? Boolean(route.is_published) : true} className="mt-1 size-4 accent-serpent" />
              <span>
                <span className="font-medium">Показувати на сайті</span>
                <span className="block text-[13px] text-muted">Зніміть позначку, щоб зберегти як чернетку.</span>
              </span>
            </label>
          </div>
        </Panel>
        <div className="flex flex-wrap items-center gap-4">
          <SubmitButton>{route ? 'Зберегти маршрут' : 'Додати маршрут'}</SubmitButton>
          <ResultNote state={state} />
        </div>
      </AdminForm>
      {route && (
        <form action={deleteRoute} className="mt-8 flex justify-end border-t-2 border-ink pt-6">
          <input type="hidden" name="id" value={route.id} />
          <ConfirmButton message={`Видалити маршрут «${route.title}»?`}>Видалити маршрут</ConfirmButton>
        </form>
      )}
    </>
  )
}
