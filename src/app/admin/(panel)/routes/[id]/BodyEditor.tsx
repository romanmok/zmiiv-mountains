'use client'

import { useMemo, useRef, useState } from 'react'
import { embedUrl, renderRouteBody } from '@/lib/route-body'
import { uploadMedia } from './media-upload'

// Markdown textarea with a toolbar for the route page body. Photos/videos upload and land at the cursor.

type Edit = { text: string; selStart: number; selEnd: number }

export function BodyEditor({ defaultValue }: { defaultValue: string }) {
  const [value, setValue] = useState(defaultValue)
  const [tab, setTab] = useState<'write' | 'preview'>('write')
  const [status, setStatus] = useState<{ text: string; error?: boolean } | null>(null)
  const area = useRef<HTMLTextAreaElement>(null)
  const photoInput = useRef<HTMLInputElement>(null)
  const videoInput = useRef<HTMLInputElement>(null)
  const preview = useMemo(() => (tab === 'preview' ? renderRouteBody(value) : ''), [tab, value])

  function apply(fn: (text: string, start: number, end: number) => Edit) {
    const el = area.current
    if (!el) return
    const next = fn(el.value, el.selectionStart, el.selectionEnd)
    setValue(next.text)
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(next.selStart, next.selEnd)
    })
  }

  /** Wrap the selection (or a placeholder) in inline markers. */
  const wrap = (before: string, after: string, placeholder: string) =>
    apply((t, s, e) => {
      const inner = t.slice(s, e) || placeholder
      return { text: t.slice(0, s) + before + inner + after + t.slice(e), selStart: s + before.length, selEnd: s + before.length + inner.length }
    })

  /** Prefix every selected line (headings, lists). */
  const prefixLines = (prefix: string) =>
    apply((t, s, e) => {
      const lineStart = t.lastIndexOf('\n', s - 1) + 1
      const block = t.slice(lineStart, e) || ''
      const out = block
        .split('\n')
        .map((l) => prefix + l.replace(/^(#{1,4} |- |\d+\. )/, ''))
        .join('\n')
      return { text: t.slice(0, lineStart) + out + t.slice(e), selStart: lineStart + out.length, selEnd: lineStart + out.length }
    })

  /** Insert a block on its own paragraph at the cursor; `caretAt` = offset inside the block for the caret. */
  const insertBlock = (block: string, caretAt = block.length, pos?: number) =>
    apply((t, s) => {
      const at = pos ?? s
      const before = t.slice(0, at).replace(/\n*$/, '')
      const after = t.slice(at).replace(/^\n*/, '')
      const head = before ? before + '\n\n' : ''
      const text = head + block + (after ? '\n\n' + after : '\n')
      return { text, selStart: head.length + caretAt, selEnd: head.length + caretAt }
    })

  async function upload(files: FileList | File[] | null) {
    const list = Array.from(files ?? [])
    if (!list.length) return
    let pos = area.current?.selectionStart ?? value.length
    for (const [i, file] of list.entries()) {
      const label = list.length > 1 ? `${i + 1} з ${list.length}` : file.name
      setStatus({ text: `Завантажую ${label}…` })
      try {
        const m = await uploadMedia(file, (p) => setStatus({ text: `Завантажую ${label}: ${Math.round(p * 100)}%` }))
        // Caret lands inside [] so the admin types the caption right away
        const block = `![](${m.url})`
        const el = area.current!
        const before = el.value.slice(0, pos).replace(/\n*$/, '')
        insertBlock(block, 2, pos)
        pos = (before ? before.length + 2 : 0) + block.length
      } catch (e) {
        setStatus({ text: `${file.name}: ${(e as Error).message}`, error: true })
        return
      }
    }
    setStatus({ text: list.length > 1 ? 'Файли додано. Допишіть підписи в квадратних дужках.' : 'Додано. Допишіть підпис у квадратних дужках.' })
  }

  function addVideoLink() {
    const url = prompt('Посилання на відео YouTube або Vimeo')?.trim()
    if (!url) return
    if (!embedUrl(url)) return setStatus({ text: 'Це не схоже на посилання YouTube чи Vimeo.', error: true })
    insertBlock(url)
    setStatus(null)
  }

  const btn = 'adm-btn adm-btn-ghost adm-btn-sm'
  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <div role="tablist" className="mr-2 flex rounded-full border-2 border-ink p-0.5 text-[13px] font-bold">
          {(['write', 'preview'] as const).map((k) => (
            <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`cursor-pointer rounded-full px-3 py-0.5 ${tab === k ? 'bg-ink text-paper' : ''}`}>
              {k === 'write' ? 'Текст' : 'Перегляд'}
            </button>
          ))}
        </div>
        {tab === 'write' && (
          <>
            <button type="button" className={btn} onClick={() => prefixLines('## ')}>Підзаголовок</button>
            <button type="button" className={btn} onClick={() => wrap('**', '**', 'жирний текст')}>Жирний</button>
            <button type="button" className={btn} onClick={() => prefixLines('- ')}>Список</button>
            <button type="button" className={btn} onClick={() => wrap('[', '](https://)', 'текст посилання')}>Посилання</button>
            <button type="button" className={btn} onClick={() => photoInput.current?.click()}>Фото</button>
            <button type="button" className={btn} onClick={() => videoInput.current?.click()}>Відео з компʼютера</button>
            <button type="button" className={btn} onClick={addVideoLink}>YouTube</button>
          </>
        )}
      </div>
      <input ref={photoInput} type="file" accept="image/*" multiple hidden onChange={(e) => (upload(e.target.files), (e.target.value = ''))} />
      <input ref={videoInput} type="file" accept="video/mp4,video/webm,video/quicktime" hidden onChange={(e) => (upload(e.target.files), (e.target.value = ''))} />

      <textarea
        ref={area}
        name="body"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onDrop={(e) => {
          if (!e.dataTransfer.files.length) return
          e.preventDefault()
          upload(e.dataTransfer.files)
        }}
        onPaste={(e) => {
          const files = Array.from(e.clipboardData.files).filter((f) => f.type.startsWith('image/'))
          if (!files.length) return
          e.preventDefault()
          upload(files)
        }}
        rows={18}
        hidden={tab !== 'write'}
        className="adm-input resize-y font-mono text-[14px] leading-relaxed"
        placeholder={'Як дістатися до старту, що побачите дорогою, де складні ділянки, де вода й відпочинок.\n\nФото можна перетягнути сюди або вставити з буфера.'}
      />
      {tab === 'preview' &&
        (preview ? (
          <div className="route-body min-h-40 rounded-[12px] border-2 border-ink bg-paper p-5" dangerouslySetInnerHTML={{ __html: preview }} />
        ) : (
          <p className="rounded-[12px] border-2 border-dashed border-muted p-5 text-muted">Текст порожній. Поверніться на вкладку «Текст».</p>
        ))}
      <p role="status" className={`min-h-5 text-[13px] ${status?.error ? 'font-medium text-brick' : 'text-muted'}`}>
        {status?.text ?? (
          <>
            <b>## </b>підзаголовок, <b>**жирний**</b>, <b>- </b>пункт списку. Фото й відео вставляються кнопками, посилання на YouTube — окремим рядком.
          </>
        )}
      </p>
    </div>
  )
}
