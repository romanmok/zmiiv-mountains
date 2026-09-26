'use client'

export function CheckAll() {
  return (
    <label className="flex items-center gap-1.5">
      <input
        type="checkbox"
        className="size-4 accent-serpent"
        onChange={(e) => {
          e.currentTarget.form?.querySelectorAll<HTMLInputElement>('input[name="ids"]').forEach((c) => (c.checked = e.currentTarget.checked))
        }}
      />
      Усі на сторінці
    </label>
  )
}
