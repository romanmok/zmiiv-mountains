'use client'

import { useFormStatus } from 'react-dom'

export type ActionResult = { ok: true; message: string } | { ok: false; error: string } | null

/**
 * React 19 resets a form after its action finishes, which wipes what the admin typed when
 * validation fails. The reset is a native, cancelable event, so we just cancel it.
 */
export function AdminForm(props: React.ComponentProps<'form'> & { action: (fd: FormData) => void }) {
  return <form {...props} onReset={(e) => e.preventDefault()} />
}

export function SubmitButton({ children, pending: label = 'Зберігаю…', className = 'adm-btn' }: { children: React.ReactNode; pending?: string; className?: string }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? label : children}
    </button>
  )
}

export function ResultNote({ state }: { state: ActionResult }) {
  if (!state) return null
  return (
    <span role="status" className={`text-sm font-medium ${state.ok ? 'text-serpent' : 'text-brick'}`}>
      {state.ok ? state.message : state.error}
    </span>
  )
}

export function Field({ label, hint, children }: { label: string; hint?: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-sm font-bold">{label}</span>
      {children}
      {hint && <span className="text-[13px] text-muted">{hint}</span>}
    </label>
  )
}

/** Submit button that asks before a destructive action. */
export function ConfirmButton({ message, children, className = 'adm-btn adm-btn-danger adm-btn-sm', ...rest }: { message: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!confirm(message)) e.preventDefault()
      }}
      {...rest}
    >
      {children}
    </button>
  )
}
