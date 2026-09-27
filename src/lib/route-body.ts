import { Marked, type Tokens } from 'marked'

// Route page body: Markdown written in the admin → safe HTML. Shared by the public page and the admin preview.
// Raw HTML is escaped, links are limited to http(s)/relative/mailto. Media conventions:
//   ![Підпис](photo.webp)            → <figure> with caption (a photo alone in its paragraph)
//   ![Підпис](clip.mp4)              → <video controls>
//   https://youtu.be/… on its own line → embedded player (YouTube / Vimeo)

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')

export function safeUrl(href: string): string | null {
  const url = href.trim()
  if (/^(https?:|mailto:)/i.test(url)) return url
  if (/^(\/(?!\/)|#)/.test(url)) return url
  return null
}

const isVideo = (href: string) => /\.(mp4|webm|mov)(\?|#|$)/i.test(href)

/** YouTube / Vimeo page URL → embeddable player URL. */
export function embedUrl(href: string): string | null {
  let u: URL
  try {
    u = new URL(href)
  } catch {
    return null
  }
  const host = u.hostname.replace(/^(www|m)\./, '')
  let yt: string | null = null
  if (host === 'youtu.be') yt = u.pathname.slice(1)
  else if (host === 'youtube.com') yt = u.searchParams.get('v') ?? /^\/(?:shorts|embed|live)\/([^/]+)/.exec(u.pathname)?.[1] ?? null
  if (yt && /^[\w-]{6,20}$/.test(yt)) {
    const t = u.searchParams.get('t') ?? u.searchParams.get('start')
    const start = t ? /^(?:(\d+)h)?(?:(\d+)m)?(\d+)s?$/.exec(t) : null
    const sec = start ? Number(start[1] ?? 0) * 3600 + Number(start[2] ?? 0) * 60 + Number(start[3]) : 0
    return `https://www.youtube-nocookie.com/embed/${yt}${sec ? `?start=${sec}` : ''}`
  }
  const vimeo = host === 'vimeo.com' ? /^\/(\d+)/.exec(u.pathname)?.[1] : null
  if (vimeo) return `https://player.vimeo.com/video/${vimeo}`
  return null
}

function media(href: string, caption: string): string {
  const src = safeUrl(href)
  if (!src) return esc(caption)
  const cap = caption ? `<figcaption>${esc(caption)}</figcaption>` : ''
  if (isVideo(src)) return `<figure class="rb-video"><video controls preload="metadata" playsinline src="${esc(src)}"></video>${cap}</figure>`
  return `<figure><img src="${esc(src)}" alt="${esc(caption)}" loading="lazy" decoding="async">${cap}</figure>`
}

const embed = (src: string) =>
  `<figure class="rb-embed"><iframe src="${esc(src)}" title="Відео" loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></figure>`

const md = new Marked({
  gfm: true,
  breaks: true,
  renderer: {
    html: ({ text }) => esc(text),
    heading({ tokens, depth }) {
      const level = Math.min(Math.max(depth, 2), 4) // h1 belongs to the page title
      return `<h${level}>${this.parser.parseInline(tokens)}</h${level}>\n`
    },
    link({ href, title, tokens }) {
      const url = safeUrl(href)
      const text = this.parser.parseInline(tokens)
      if (!url) return text
      const external = /^https?:/i.test(url)
      return `<a href="${esc(url)}"${title ? ` title="${esc(title)}"` : ''}${external ? ' target="_blank" rel="noopener noreferrer"' : ''}>${text}</a>`
    },
    image({ href, text }) {
      // inline (inside text): plain image, no figure
      const src = safeUrl(href)
      if (!src) return esc(text)
      return isVideo(src) ? media(href, text) : `<img src="${esc(src)}" alt="${esc(text)}" loading="lazy" decoding="async">`
    },
    paragraph({ tokens }) {
      const parts = tokens.filter((t) => !(t.type === 'text' && !t.raw.trim()) && t.type !== 'br')
      if (parts.length > 0 && parts.every((t) => t.type === 'image')) return parts.map((t) => media((t as Tokens.Image).href, (t as Tokens.Image).text)).join('\n') + '\n'
      if (parts.length === 1 && parts[0].type === 'link') {
        const link = parts[0] as Tokens.Link
        const src = link.text === link.href || link.raw === link.href ? embedUrl(link.href) : null
        if (src) return embed(src) + '\n'
      }
      return `<p>${this.parser.parseInline(tokens)}</p>\n`
    },
  },
})

export function renderRouteBody(markdown: string | null | undefined): string {
  if (!markdown?.trim()) return ''
  return md.parse(markdown, { async: false })
}

/** First image of the body, for og:image when the route has no cover. */
export function firstImage(markdown: string | null | undefined): string | null {
  const m = /!\[[^\]]*\]\(([^)\s]+)/.exec(markdown ?? '')
  return m && !isVideo(m[1]) ? safeUrl(m[1]) : null
}
