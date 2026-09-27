import type { SiteSettings } from '@/lib/settings'

// Header and footer shared by the home page and inner pages (route pages).
// Anchors point at the home page, so they work from any page.

export function SiteHeader({ t }: { t: SiteSettings }) {
  return (
    <header className="mx-auto max-w-[1160px] px-5">
      <div className="flex h-19 items-center justify-between">
        <a href="/" className="font-display text-xl font-black text-serpent no-underline">
          {t.site_name}
        </a>
        <nav className="hidden gap-5.5 font-medium min-[600px]:flex">
          <a href="/#feed" className="hover:text-brick">Новини</a>
          <a href="/#routes" className="hover:text-brick">Маршрути</a>
          <a href="/#places" className="hover:text-brick">Місця</a>
        </nav>
      </div>
    </header>
  )
}

export function SiteFooter({ t }: { t: SiteSettings }) {
  const contact = t.footer_contact
  const contactHref = contact.startsWith('@') ? `https://t.me/${contact.slice(1)}` : contact.includes('@') ? `mailto:${contact}` : contact
  return (
    <footer className="bg-ink pt-10 pb-14 text-sm text-soft">
      <div className="mx-auto flex max-w-[1160px] flex-wrap justify-between gap-6 px-5">
        <div>
          {t.site_name} {t.footer_about}
          {contact && (
            <>
              {' '}
              Надіслати новину:{' '}
              <a href={contactHref} className="underline hover:text-ochre">
                {contact}
              </a>
            </>
          )}
        </div>
        <div>{t.footer_note}</div>
      </div>
    </footer>
  )
}
