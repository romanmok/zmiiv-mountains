'use client'

import { useRef, useState } from 'react'
import { uploadMedia } from './media-upload'

/** Route cover photo: shown on the route page top and as the preview in messengers. */
export function CoverField({ defaultValue }: { defaultValue: string }) {
  const [url, setUrl] = useState(defaultValue)
  const [status, setStatus] = useState<{ text: string; error?: boolean } | null>(null)
  const input = useRef<HTMLInputElement>(null)

  async function pick(file: File | undefined) {
    if (!file) return
    setStatus({ text: 'Завантажую…' })
    try {
      const m = await uploadMedia(file, (p) => setStatus({ text: `Завантажую: ${Math.round(p * 100)}%` }))
      if (m.kind !== 'image') throw new Error('Для обкладинки потрібне фото, не відео.')
      setUrl(m.url)
      setStatus(null)
    } catch (e) {
      setStatus({ text: (e as Error).message, error: true })
    }
  }

  return (
    <div className="grid gap-1.5">
      <span className="text-sm font-bold">Обкладинка</span>
      <input type="hidden" name="cover_url" value={url} />
      <div className="flex flex-wrap items-center gap-4">
        {url ? (
          <img src={url} alt="" className="h-24 w-40 rounded-[12px] border-2 border-ink object-cover" />
        ) : (
          <div className="grid h-24 w-40 place-items-center rounded-[12px] border-2 border-dashed border-muted text-[13px] text-muted">Немає фото</div>
        )}
        <div className="flex flex-wrap gap-2">
          <button type="button" className="adm-btn adm-btn-ghost adm-btn-sm" onClick={() => input.current?.click()}>
            {url ? 'Замінити фото' : 'Завантажити фото'}
          </button>
          {url && (
            <button type="button" className="adm-btn adm-btn-danger adm-btn-sm" onClick={() => setUrl('')}>
              Прибрати
            </button>
          )}
        </div>
      </div>
      <input ref={input} type="file" accept="image/*" hidden onChange={(e) => (pick(e.target.files?.[0]), (e.target.value = ''))} />
      <span role="status" className={`text-[13px] ${status?.error ? 'font-medium text-brick' : 'text-muted'}`}>
        {status?.text ?? 'Горизонтальне фото. Показується вгорі сторінки маршруту і в превʼю, коли посиланням діляться в месенджерах.'}
      </span>
    </div>
  )
}
