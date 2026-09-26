import type { Metadata } from 'next'
import { Onest, Unbounded } from 'next/font/google'
import { SITE_DESCRIPTION, SITE_NAME } from '@/lib/site'
import './globals.css'

const unbounded = Unbounded({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-unbounded',
  display: 'swap',
  weight: ['500', '700', '900'],
})

const onest = Onest({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-onest',
  display: 'swap',
  weight: ['400', '500', '700'],
})

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME} — Зміїв і села громади`, template: `%s · ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  openGraph: { type: 'website', locale: 'uk_UA', siteName: SITE_NAME, description: SITE_DESCRIPTION },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk" className={`${unbounded.variable} ${onest.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
