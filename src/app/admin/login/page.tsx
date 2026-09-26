'use client'

import { useActionState } from 'react'
import { AdminForm } from '../_ui'
import { loginAction, type LoginState } from './actions'

export default function LoginPage() {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, undefined)
  return (
    <main className="grid min-h-screen place-items-center px-4">
      <AdminForm action={action} className="grid w-full max-w-[380px] gap-4 rounded-[28px] border-2 border-ink bg-white p-8">
        <h1 className="text-3xl font-black text-serpent">Вхід в адмінку</h1>
        {state?.error && (
          <p role="alert" className="rounded-xl border-2 border-brick px-3 py-2 text-sm font-medium text-brick">
            {state.error}
          </p>
        )}
        <label className="grid gap-1.5">
          <span className="text-sm font-bold">Логін</span>
          <input className="adm-input" name="username" autoComplete="username" required autoFocus />
        </label>
        <label className="grid gap-1.5">
          <span className="text-sm font-bold">Пароль</span>
          <input className="adm-input" name="password" type="password" autoComplete="current-password" required />
        </label>
        <button className="adm-btn mt-2 justify-center" type="submit" disabled={pending}>
          {pending ? 'Перевіряю…' : 'Увійти'}
        </button>
      </AdminForm>
    </main>
  )
}
