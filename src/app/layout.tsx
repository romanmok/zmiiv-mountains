import type { Metadata, Viewport } from 'next'
import { Onest, Unbounded } from 'next/font/google'
import { getSiteSettings } from '@/lib/settings'
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

// Site has one light palette. Samsung Internet ignores 'only light' and force-darkens pages that don't
// declare dark support, so meta claims 'light dark' while globals.css pins color-scheme to light
export const viewport: Viewport = { colorScheme: 'light dark', themeColor: '#fff8ec' }

export async function generateMetadata(): Promise<Metadata> {
  const t = await getSiteSettings()
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: `${t.site_name} — ${t.site_title_suffix}`, template: `%s · ${t.site_name}` },
    description: t.site_description,
    openGraph: { type: 'website', locale: 'uk_UA', siteName: t.site_name, description: t.site_description },
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk" className={`${unbounded.variable} ${onest.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
