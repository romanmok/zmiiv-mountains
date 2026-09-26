'use client'

import { useActionState } from 'react'
import { resetSetting, saveSettings } from '../../_actions/settings'
import { AdminForm, Field, ResultNote, SubmitButton, type ActionResult } from '../../_ui'
import { Panel } from '../../_ui/Panel'
import type { SettingGroup } from '@/lib/settings'

export function SettingsForm({ groups, values }: { groups: SettingGroup[]; values: Record<string, string> }) {
  const [state, action] = useActionState<ActionResult, FormData>(saveSettings, null)
  return (
    <AdminForm action={action}>
      {groups.map((g) => (
        <Panel key={g.id} title={g.label}>
          <div className="grid gap-4">
            {g.fields.map((f) => {
              const changed = values[f.key] !== f.default
              const hint = changed ? (
                <>
                  Змінено.{' '}
                  <button type="button" className="cursor-pointer text-brick underline" onClick={() => resetSetting(f.key).then(() => location.reload())}>
                    Повернути стандартний текст
                  </button>
                </>
              ) : undefined
              return (
                <Field key={f.key} label={f.label} hint={hint}>
                  {f.multiline ? (
                    <textarea name={`s_${f.key}`} defaultValue={values[f.key]} rows={3} className="adm-input resize-y" />
                  ) : (
                    <input name={`s_${f.key}`} defaultValue={values[f.key]} className="adm-input" />
                  )}
                </Field>
              )
            })}
          </div>
        </Panel>
      ))}
      <div className="sticky bottom-4 flex items-center justify-end gap-4 rounded-full border-2 border-ink bg-paper px-4 py-2">
        <ResultNote state={state} />
        <SubmitButton>Зберегти тексти</SubmitButton>
      </div>
    </AdminForm>
  )
}
