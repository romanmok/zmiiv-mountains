import { describe, expect, it } from 'vitest'
import { parseTelegramPreview } from '../telegram'

const HTML = `
<div class="tgme_widget_message" data-post="podslushano_zmiev/101">
  <div class="tgme_widget_message_text js-message_text" dir="auto">Ранковий туман над Дінцем<br/>Фото читачів &amp; друзів</div>
  <a class="tgme_widget_message_date"><time datetime="2026-09-26T06:30:00+00:00">06:30</time></a>
</div>
<div class="tgme_widget_message" data-post="podslushano_zmiev/102">
  <a class="tgme_widget_message_photo_wrap" style="background-image:url('https://cdn.example/p.jpg')"></a>
  <a class="tgme_widget_message_date"><time datetime="2026-09-26T07:00:00+00:00">07:00</time></a>
</div>`

describe('parseTelegramPreview', () => {
  it('parses text posts and skips media-only posts', () => {
    const entries = parseTelegramPreview(HTML)
    expect(entries).toHaveLength(1)
    expect(entries[0]).toMatchObject({
      title: 'Ранковий туман над Дінцем',
      text: 'Ранковий туман над Дінцем\nФото читачів & друзів',
      url: 'https://t.me/podslushano_zmiev/101',
    })
    expect(entries[0].publishedAt.toISOString()).toBe('2026-09-26T06:30:00.000Z')
  })
})

describe('titleFromText', async () => {
  const { titleFromText } = await import('../text')
  it('skips hashtag-only lines', () => {
    expect(titleFromText('#нампишуть\nУ парку висадили каштани')).toBe('У парку висадили каштани')
  })
})
