'use client'

import { useTransition } from 'react'
import { setItemSettlement } from '../../_actions/news'

export function SettlementSelect({ itemId, value, settlements }: { itemId: number; value: number | null; settlements: { id: number; name: string }[] }) {
  const [pending, start] = useTransition()
  return (
    <select
      aria-label="Населений пункт"
      defaultValue={value ?? ''}
      disabled={pending}
      onChange={(e) => {
        const v = e.target.value
        start(() => setItemSettlement(itemId, v ? Number(v) : null))
      }}
      className="rounded-full border-2 border-ink bg-white px-2 py-0.5 text-[13px] font-bold"
    >
      <option value="">без села</option>
      {settlements.map((s) => (
        <option key={s.id} value={s.id}>
          {s.name}
        </option>
      ))}
    </select>
  )
}
