import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { knex } from '@/lib/knex'
import { MediaError, storeMedia } from '@/lib/media'

// Admin upload for route photos/videos. Route handler, not a server action: actions cap the body at 1 MB.
export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Сесія завершилась. Увійдіть знову.' }, { status: 401 })

  const file = (await req.formData().catch(() => null))?.get('file')
  if (!(file instanceof File) || file.size === 0) return NextResponse.json({ error: 'Файл не отримано.' }, { status: 400 })

  try {
    const m = await storeMedia(file)
    await knex('media').insert({ ...m, original_name: file.name.slice(0, 256), uploaded_by: user.id })
    return NextResponse.json({ url: m.url, kind: m.kind, width: m.width, height: m.height })
  } catch (e) {
    if (e instanceof MediaError) return NextResponse.json({ error: e.message }, { status: 400 })
    console.error('media upload failed', e)
    return NextResponse.json({ error: 'Не вдалося зберегти файл. Спробуйте ще раз.' }, { status: 500 })
  }
}
