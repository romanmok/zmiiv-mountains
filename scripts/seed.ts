import path from 'node:path'
import { createHash } from 'node:crypto'
import { config as loadEnv } from 'dotenv'

loadEnv({ path: path.resolve(process.cwd(), '.env.local') })
loadEnv({ path: path.resolve(process.cwd(), '.env') })

import { knex } from '../src/lib/knex'
import { DEFAULT_NOISE, DEFAULT_SAFETY } from '../src/lib/collectors/filters'

// Map coordinates are in the SVG viewBox 0 0 560 446 of public/map/zmiiv-base.svg (real OSM positions, see VillageMap).
const SETTLEMENTS = [
  { slug: 'zmiiv', name: 'Зміїв', kind: 'city', map_x: 204, map_y: 143, label_x: 140, label_y: 120, keywords: 'зміїв,змієв,змиев' },
  { slug: 'haidary', name: 'Гайдари', kind: 'village', map_x: 102, map_y: 264, label_x: 118, label_y: 269, keywords: 'гайдар' },
  { slug: 'korobiv-khutir', name: 'Коробів Хутір', kind: 'village', map_x: 171, map_y: 366, label_x: 187, label_y: 371, keywords: 'коробів,коробов' },
  { slug: 'zadonetske', name: 'Задонецьке', kind: 'village', map_x: 182, map_y: 222, label_x: 198, label_y: 227, keywords: 'задонецьк' },
  { slug: 'lyman', name: 'Лиман', kind: 'village', map_x: 381, map_y: 353, label_x: 361, label_y: 381, keywords: 'лиман' },
  { slug: 'slobozhanske', name: 'Слобожанське', kind: 'village', map_x: 480, map_y: 341, label_x: 430, label_y: 325, keywords: 'слобожанське,слобожанському,слобожанського,слобожанское' },
]

type SourceSeed = {
  name: string
  type: 'rss' | 'telegram' | 'youtube'
  url: string
  site_url: string
  require_keyword?: boolean
  settlement?: string
}

// Real MVP sources, see documentation/content-research-2026-09.md
const SOURCES: SourceSeed[] = [
  { name: 'Зміївська міська рада', type: 'rss', url: 'http://www.zmiivmisto.gov.ua/?format=feed&type=rss', site_url: 'http://www.zmiivmisto.gov.ua/', settlement: 'zmiiv' },
  { name: 'Вісті Зміївщини', type: 'rss', url: 'https://api.gromada.group/feed/zmiiv', site_url: 'https://zmiiv.gromada.group/' },
  { name: 'zmiiv.com.ua', type: 'rss', url: 'https://zmiiv.com.ua/feed/', site_url: 'https://zmiiv.com.ua/news-zmiiv/' },
  { name: 'НПП «Гомільшанські ліси»', type: 'rss', url: 'https://gomilsha.org.ua/feed/', site_url: 'https://gomilsha.org.ua/' },
  { name: 'Чугуївська РВА', type: 'rss', url: 'https://rda.org.ua/rss/286/', site_url: 'https://chuhuiv-rda.gov.ua/news/', require_keyword: true },
  { name: 'Подслушано Змиёв', type: 'telegram', url: 'podslushano_zmiev', site_url: 'https://t.me/podslushano_zmiev' },
  { name: 'ШоТам Зміїв', type: 'telegram', url: 'LN1210', site_url: 'https://t.me/LN1210' },
  { name: 'Медіа-Зміїв', type: 'youtube', url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCkQ9oJoWvIVznDuNcSBrVJg', site_url: 'https://www.youtube.com/channel/UCkQ9oJoWvIVznDuNcSBrVJg' },
]

// Demo feed until collectors run: real source names, illustrative headlines, links to the source home page.
const DEMO_ITEMS = [
  { source: 'Зміївська міська рада', settlement: 'zmiiv', title: 'Графік особистого прийому громадян на жовтень', hoursAgo: 2 },
  { source: 'Вісті Зміївщини', settlement: 'zadonetske', title: 'Відремонтували зупинку біля школи', hoursAgo: 4 },
  { source: 'Подслушано Змиёв', settlement: 'korobiv-khutir', title: 'Екскурсія до городища: збір у суботу', hoursAgo: 7 },
  { source: 'zmiiv.com.ua', settlement: 'lyman', title: 'Бази відпочинку завершують сезон', hoursAgo: 26 },
  { source: 'Медіа-Зміїв', settlement: 'zmiiv', title: 'Сюжет: як готуються до опалювального сезону', hoursAgo: 30 },
  { source: 'НПП «Гомільшанські ліси»', settlement: 'haidary', title: 'Осінні екскурсії стежкою «Козача гора»', hoursAgo: 50 },
  { source: 'ШоТам Зміїв', settlement: 'slobozhanske', title: 'У будинку культури відкрили гурток кераміки', hoursAgo: 75 },
]

const ROUTES = [
  { slug: 'kruchi-ring', settlement: 'zmiiv', title: 'Кільце Зміївськими кручами', kind: 'hike', length_km: 11.8, elevation_m: 170, description: 'Правий берег Дінця: білі кварцові піски на схилах, сосновий бір і види на заплаву.' },
  { slug: 'kozacha-hora', settlement: 'haidary', title: 'Екостежка «Козача гора»', kind: 'eco_trail', length_km: null, elevation_m: null, description: 'Маршрут НПП «Гомільшанські ліси» крутосхилом над Дінцем.' },
  { slug: 'dubovyi-hai', settlement: 'haidary', title: 'Екостежка «Дубовий гай»', kind: 'eco_trail', length_km: null, elevation_m: null, description: 'Старий дубовий ліс нацпарку.' },
  { slug: 'korobovi-khutory-horodyshche', settlement: 'korobiv-khutir', title: 'До городища над Дінцем', kind: 'hike', length_km: null, elevation_m: null, description: 'Короткий вихід до давнього поселення на високому березі.' },
  { slug: 'lyman-lake', settlement: 'lyman', title: 'Навколо озера Лиман', kind: 'bike', length_km: null, elevation_m: null, description: 'Бази відпочинку, пляжі й лісові дороги.' },
]

const PLACES = [
  { slug: 'kruchi', settlement: 'zmiiv', name: 'Зміївські кручі', kind: 'Природа', description: 'Високий правий берег Дінця. Білі схили — це чисті кварцові піски берекського регіоярусу, а не крейда.', attribution: null },
  { slug: 'gomilsha', settlement: 'haidary', name: 'Гомільшанські ліси', kind: 'Нацпарк', description: 'Екостежки «Сіверсько-Донецькі крутосхили», «Дубовий гай» і «Козача гора».', attribution: null },
  { slug: 'haidary-horodyshche', settlement: 'haidary', name: 'Городище в Гайдарах', kind: 'Археологія', description: 'Давнє поселення на високому березі Дінця.', attribution: null },
  { slug: 'museum', settlement: 'zmiiv', name: 'Краєзнавчий музей', kind: 'Музей', description: 'Історія фортеці 1656 року і сучасного Зміїва.', attribution: null },
]

// Local legends only (no Kyiv-region «Змієві вали»), retold from the sources in source_url. Home page shows a random one.
const LEGENDS = [
  {
    settlement: 'zmiiv',
    title: 'Звідки взялася назва Зміїв',
    body: 'Старожили пояснюють назву по-різному. Одні кажуть, що річка, яка впадає тут у Мжу, в’ється, мов змія. Інші — що в болотистих лісах довкола колись аж кишіло плазунів. А ще переказують, що місто назвали на честь давнього засновника на ім’я Змій.',
    note: 'Історик Омелян Пріцак пов’язував назву з половецьким «містом Змія» Шаруканню, а статистичний опис XIX століття чесно визнавав: походження назви «воістину невідоме».',
    source_url: 'https://www.slk.kh.ua/news/kultura/istoriya-nazvi-mista-zmiyiv-vid-polovetskogo-khana-do-moskovskogo-voyevodi.html',
  },
  {
    settlement: 'korobiv-khutir',
    title: 'Останній бій на Козачій горі',
    body: 'На горі над Дінцем стояв Свято-Миколаївський монастир, куди на старість ішли поранені й літні козаки. Коли за наказом Катерини II туди рушило царське військо, козаки прийняли бій. Програвши, вони не здалися в полон, а кинулися з кручі в Донець. Відтоді гору звуть Козачою.',
    note: 'За документами, 1788 року в монастирі лишалися тільки ігумен і четверо ченців, і обитель просто закрили указом, без штурму.',
    source_url: 'https://tourcenter.kh.ua/uk/legend/legenda-pro-kozachu-goru',
  },
  {
    settlement: 'korobiv-khutir',
    title: 'Золота долина і Біле озеро',
    body: 'Кажуть, перед нападом ченці-козаки встигли сховати монастирські скарби. Золото закопали в долині, яку відтоді звуть Золотою, а срібло кинули в озеро, що через це стало Білим. Таємницю схованки козаки забрали з собою, і скарбів досі ніхто не знайшов.',
    note: 'Жодного скарбу не знайдено. Місцеві посилаються хіба на підвищений вміст срібла у воді озера.',
    source_url: 'https://ukrainaincognita.com/mista/koropove-kozacha-hora-ta-monastyr',
  },
  {
    settlement: 'korobiv-khutir',
    title: 'Потьомкін у чернечій рясі',
    body: 'Переказують, що князь Потьомкін власною персоною перевдягнувся старим ченцем і пробрався в монастир на Козачій горі. Він довго вивчав підземні ходи обителі, а тоді передав їхній план цариці. Саме цими ходами солдати згодом і вдерлися всередину.',
    note: 'Документальних підтверджень немає, дослідники вважають цю історію вигадкою.',
    source_url: 'https://ukrainaincognita.com/mista/koropove-kozacha-hora-ta-monastyr',
  },
  {
    settlement: null,
    title: 'Розбійник Мохнач і прокляте золото',
    body: 'Колись у Чорному лісі переховувався розбійник Мохнач, що з ватагою грабував подорожніх. Коли він помер, товариші поховали його в лісі, а награбоване золото сховали між чотирма дубами, скували їх залізними ланцюгами й наклали прокляття. Кажуть, хто натрапить на те місце, блукатиме лісом до самого ранку.',
    note: 'Мовознавці виводять назву села Мохнач від давнього «мъхнатий» — зарослий, кошлатий. Мохнацьке городище значно старше за будь-яких розбійників.',
    source_url: 'https://colovrat.org/publ/1-1-0-424',
  },
  {
    settlement: null,
    title: 'Суворовська криниця',
    body: 'Біля Мохнача під Чорною горою б’є джерело з червонуватою залізистою водою. Переказують, що тут проходили війська Суворова: пораненому солдатові ця вода швидко загоїла рани, а в тих, хто хворів на очі, недуга минула, щойно вони вмилися з криниці. Відтоді джерело звуть Суворовським, або Червоною криницею.',
    note: 'Чи бував тут Суворов, історики сперечаються. А от заліза у воді справді багато.',
    source_url: 'https://esu.com.ua/search_articles.php?id=69417',
  },
  {
    settlement: 'lyman',
    title: 'Село на дні Лиману',
    body: 'Колись на місці озера стояло село, але люди там так прогнівили Бога, що воно провалилося під землю, а зверху розлилася вода. Кажуть, тихого ранку, приклавши вухо до землі, можна почути, як господині скликають худобу. А в посуху рибалки бачили з води хрест потопленої церкви й прив’язували до нього човни.',
    note: 'Насправді озеро Лиман — давнє русло Сіверського Дінця.',
    source_url: 'https://km-sov.gov.ua/index.php/about-the-council/historical-reference/lyman-village/1601-%D1%81%D0%B5%D0%BB%D0%BE-%D0%BB%D0%B8%D0%BC%D0%B0%D0%BD.html?showall=1',
  },
]

async function main() {
  await knex.transaction(async (trx) => {
    for (const t of ['items', 'routes', 'places', 'legends', 'sources', 'settlements']) await trx(t).del()

    await trx('settlements').insert(SETTLEMENTS.map((s, i) => ({ ...s, sort_order: i })))
    const settlementIds = Object.fromEntries(
      (await trx('settlements').select('id', 'slug')).map((s: { id: number; slug: string }) => [s.slug, s.id]),
    )

    await trx('sources').insert(
      SOURCES.map((s) => ({
        name: s.name,
        type: s.type,
        url: s.url,
        site_url: s.site_url,
        require_keyword: s.require_keyword ?? false,
        default_settlement_id: s.settlement ? settlementIds[s.settlement] : null,
      })),
    )
    const sources = await trx('sources').select('id', 'name', 'site_url')
    const sourceByName = Object.fromEntries(sources.map((s: { id: number; name: string; site_url: string }) => [s.name, s]))

    const now = Date.now()
    await trx('items').insert(
      DEMO_ITEMS.map((d, i) => {
        const src = sourceByName[d.source]
        const url = `${src.site_url}#demo-${i}`
        return {
          source_id: src.id,
          settlement_id: settlementIds[d.settlement],
          title: d.title,
          url,
          url_hash: createHash('sha256').update(url).digest('hex'),
          published_at: new Date(now - d.hoursAgo * 3_600_000).toISOString().slice(0, 19).replace('T', ' '),
          is_demo: true,
        }
      }),
    )

    await trx('routes').insert(ROUTES.map(({ settlement, ...r }, i) => ({ ...r, settlement_id: settlementIds[settlement], sort_order: i })))
    await trx('places').insert(PLACES.map(({ settlement, ...p }, i) => ({ ...p, settlement_id: settlementIds[settlement], sort_order: i })))
    await trx('legends').insert(LEGENDS.map(({ settlement, ...l }) => ({ ...l, settlement_id: settlement ? settlementIds[settlement] : null })))

    // Stop-words: only on first seed, afterwards they belong to the admin (users/settings are never touched)
    const [{ n }] = await trx('filter_words').count({ n: '*' })
    if (Number(n) === 0) {
      await trx('filter_words').insert([
        ...DEFAULT_SAFETY.map((word) => ({ kind: 'safety', word })),
        ...DEFAULT_NOISE.map((word) => ({ kind: 'noise', word })),
      ])
    }
  })
  console.log('Seed done')
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(() => knex.destroy())
