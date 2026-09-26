'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/admin/news', label: 'Новини' },
  { href: '/admin/sources', label: 'Джерела' },
  { href: '/admin/filters', label: 'Фільтри' },
  { href: '/admin/routes', label: 'Маршрути' },
  { href: '/admin/settings', label: 'Тексти сайту' },
]

export function AdminNav({ pending }: { pending: number }) {
  const path = usePathname()
  return (
    <nav className="flex flex-wrap gap-1">
      {NAV.map((it) => {
        const active = path.startsWith(it.href)
        return (
          <Link
            key={it.href}
            href={it.href}
            aria-current={active ? 'page' : undefined}
            className={`rounded-full px-3 py-1 text-[15px] font-medium no-underline ${active ? 'bg-ink text-paper' : 'hover:bg-soft'}`}
          >
            {it.label}
            {it.href === '/admin/news' && pending > 0 && (
              <span className="ml-1.5 rounded-full bg-ochre px-1.5 text-[12px] font-bold text-ink">{pending}</span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}
