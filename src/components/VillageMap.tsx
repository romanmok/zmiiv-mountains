'use client'

import type { Settlement } from '@/lib/db/types'

interface Props {
  settlements: Settlement[]
  selected: number | null
  onSelect: (id: number | null) => void
}

// TODO: replace the schematic with a detailed, beautiful map (relief of the Kruchi, forests, Donets bends)
// — product owner priority, see documentation/po-feedback-2026-09-26.md
export function VillageMap({ settlements, selected, onSelect }: Props) {
  const toggle = (id: number) => onSelect(selected === id ? null : id)

  return (
    <div className="rounded-[28px] bg-soft p-2.5">
      <svg viewBox="0 0 560 420" role="group" aria-label="Мапа Зміїва і сіл довкола" className="block h-auto w-full">
        <ellipse className="fill-forest" cx="140" cy="300" rx="120" ry="70" />
        <ellipse className="fill-forest" cx="430" cy="110" rx="100" ry="55" />
        <path
          className="fill-none stroke-river"
          strokeWidth={14}
          strokeLinecap="round"
          d="M20 60 C120 80 160 150 230 170 S330 150 360 210 S420 330 540 360"
        />
        {settlements.map((s) => (
          <g
            key={s.id}
            className={`pin${s.kind === 'city' ? ' city' : ''}`}
            tabIndex={0}
            role="button"
            aria-pressed={selected === s.id}
            onClick={() => toggle(s.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                toggle(s.id)
              }
            }}
          >
            <circle cx={s.map_x} cy={s.map_y} r={s.kind === 'city' ? 14 : 10} />
            <text x={s.label_x} y={s.label_y} style={s.kind === 'city' ? { fontSize: 19 } : undefined}>
              {s.name}
            </text>
          </g>
        ))}
        <text x="430" y="400" className="fill-muted" style={{ font: '500 12px var(--font-onest), sans-serif' }}>
          Сіверський Донець
        </text>
      </svg>
    </div>
  )
}
