'use client'

import { useActionState, useEffect, useRef } from 'react'
import { changePassword } from '../../_actions/account'
import { AdminForm, Field, ResultNote, SubmitButton, type ActionResult } from '../../_ui'
import { Panel } from '../../_ui/Panel'

export function PasswordForm({ username, minLength }: { username: string; minLength: number }) {
  const [state, action] = useActionState<ActionResult, FormData>(changePassword, null)
  const form = useRef<HTMLFormElement>(null)

  // AdminForm keeps input after errors; after success the passwords must not stay in the fields
  useEffect(() => {
    if (state?.ok) form.current?.querySelectorAll('input[type=password]').forEach((el) => ((el as HTMLInputElement).value = ''))
  }, [state])

  return (
    <AdminForm action={action} ref={form}>
      <Panel title="Зміна пароля" className="max-w-[560px]">
        {/* Lets password managers match the new password to the account */}
        <input type="text" name="username" value={username} autoComplete="username" readOnly hidden />
        <div className="grid gap-4">
          <Field label="Поточний пароль">
            <input type="password" name="current" required autoComplete="current-password" className="adm-input" />
          </Field>
          <Field label="Новий пароль" hint={`Щонайменше ${minLength} символів.`}>
            <input type="password" name="next" required minLength={minLength} autoComplete="new-password" className="adm-input" />
          </Field>
          <Field label="Повторіть новий пароль">
            <input type="password" name="repeat" required minLength={minLength} autoComplete="new-password" className="adm-input" />
          </Field>
        </div>
      </Panel>
      <div className="flex flex-wrap items-center gap-4">
        <SubmitButton>Змінити пароль</SubmitButton>
        <ResultNote state={state} />
      </div>
    </AdminForm>
  )
}
