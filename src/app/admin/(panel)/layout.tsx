import Link from 'next/link'
import { requirePageUser } from '@/lib/auth/session'
import { knex } from '@/lib/knex'
import { logoutAction } from '../login/actions'
import { AdminNav } from './AdminNav'

export const dynamic = 'force-dynamic'

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePageUser()
  const [{ n }] = await knex('items').where({ status: 'pending' }).count({ n: '*' })

  return (
    <>
      <header className="border-b-2 border-ink bg-white">
        <div className="mx-auto flex max-w-[1160px] flex-wrap items-center gap-x-6 gap-y-2 px-5 py-3">
          <Link href="/admin" className="font-display text-lg font-black text-serpent no-underline">
            Адмінка
          </Link>
          <AdminNav pending={Number(n)} />
          <div className="ml-auto flex items-center gap-3 text-sm">
            <Link href="/" target="_blank" className="text-muted hover:text-brick">
              Відкрити сайт
            </Link>
            <Link href="/admin/account" title="Обліковий запис, зміна пароля" className="text-muted hover:text-brick">
              {user.displayName || user.username}
            </Link>
            <form action={logoutAction}>
              <button type="submit" className="adm-btn adm-btn-ghost adm-btn-sm">
                Вийти
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1160px] px-5 py-8">{children}</main>
    </>
  )
}
