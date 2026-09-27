import { describe, expect, it } from 'vitest'
import { embedUrl, renderRouteBody } from '../route-body'

describe('renderRouteBody', () => {
  it('escapes raw HTML', () => {
    const html = renderRouteBody('Привіт <script>alert(1)</script> <img src=x onerror=alert(1)>')
    expect(html).not.toContain('<script')
    expect(html).not.toContain('<img src=x')
    expect(html).toContain('&lt;script&gt;')
  })

  it('drops javascript: links', () => {
    const html = renderRouteBody('[клік](javascript:alert(1))')
    expect(html).not.toContain('javascript:')
    expect(html).toContain('клік')
  })

  it('wraps a standalone photo into a figure with caption', () => {
    const html = renderRouteBody('![Вид з кручі](/media/2026/09/a.webp)')
    expect(html).toContain('<figure><img src="/media/2026/09/a.webp" alt="Вид з кручі"')
    expect(html).toContain('<figcaption>Вид з кручі</figcaption>')
  })

  it('renders uploaded video as <video>', () => {
    expect(renderRouteBody('![Спуск](https://cdn.example/a.mp4)')).toContain('<video controls')
  })

  it('embeds a YouTube link on its own line', () => {
    const html = renderRouteBody('Текст\n\nhttps://youtu.be/dQw4w9WgXcQ\n\nЩе текст')
    expect(html).toContain('src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"')
  })

  it('keeps a YouTube link inside a sentence as a link', () => {
    const html = renderRouteBody('Дивіться [тут](https://youtu.be/dQw4w9WgXcQ) відео')
    expect(html).not.toContain('<iframe')
    expect(html).toContain('<a href="https://youtu.be/dQw4w9WgXcQ"')
  })

  it('demotes h1 to h2', () => {
    expect(renderRouteBody('# Старт')).toContain('<h2>Старт</h2>')
  })
})

describe('embedUrl', () => {
  it('parses YouTube variants', () => {
    expect(embedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=1m5s')).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?start=65')
    expect(embedUrl('https://youtube.com/shorts/dQw4w9WgXcQ')).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ')
    expect(embedUrl('https://vimeo.com/76979871')).toBe('https://player.vimeo.com/video/76979871')
    expect(embedUrl('https://example.com/watch?v=abc')).toBeNull()
  })
})
