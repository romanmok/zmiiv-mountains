'use client'

import type { Settlement } from '@/lib/db/types'

interface Props {
  settlements: Settlement[]
  selected: number | null
  onSelect: (id: number | null) => void
}

// Base map = real OSM geometry (Donets course, lakes, forests) baked into public/map/zmiiv-base.svg,
// projected to this viewBox; settlement coords in the DB use the same projection.
export function VillageMap({ settlements, selected, onSelect }: Props) {
  const toggle = (id: number) => onSelect(selected === id ? null : id)

  return (
    <div className="rounded-[28px] bg-soft p-2.5">
      <svg viewBox="0 0 560 446" role="group" aria-label="Мапа Зміїва і сіл довкола" className="block h-auto w-full rounded-[20px]">
        <image href="/map/zmiiv-base.svg" width="560" height="446" aria-hidden="true" />
        <text
          x="300"
          y="215"
          transform="rotate(-24 300 215)"
          className="pointer-events-none fill-river-ink"
          style={{ font: 'italic 500 12px var(--font-onest), sans-serif' }}
        >
          Сіверський Донець
        </text>
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
      </svg>
    </div>
  )
}
