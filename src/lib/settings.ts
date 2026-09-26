import { knex } from './knex'

// Site texts editable in /admin/settings. Grouped by key prefix, like maska-theatre.
// The default is used until the key is saved from the admin, so the site never renders empty.
export interface SettingField {
  key: string
  label: string
  default: string
  multiline?: boolean
}

export interface SettingGroup {
  id: string
  label: string
  fields: SettingField[]
}

export const SETTING_GROUPS: SettingGroup[] = [
  {
    id: 'site',
    label: 'Бренд і пошук',
    fields: [
      // TODO: confirm final brand spelling with product owner («Змієві гори» vs «Зміївські гори»)
      { key: 'site_name', label: 'Назва сайту (шапка, футер, вкладка браузера)', default: 'Зміївські гори' },
      { key: 'site_title_suffix', label: 'Підзаголовок вкладки на головній', default: 'Зміїв і села громади' },
      {
        key: 'site_description',
        label: 'Опис для пошуковиків і соцмереж',
        default: 'Новини Зміїва й сіл громади в одній стрічці та путівник кручами, лісами й маршрутами над Дінцем.',
        multiline: true,
      },
    ],
  },
  {
    id: 'hero',
    label: 'Перший екран',
    fields: [
      { key: 'hero_title', label: 'Заголовок', default: 'Зміїв і все довкола' },
      {
        key: 'hero_lead',
        label: 'Підзаголовок',
        default: 'Новини міста й сіл громади в одній стрічці та маршрути кручами й лісами над Дінцем.',
        multiline: true,
      },
      { key: 'hero_hint', label: 'Підказка біля мапи', default: 'Натисніть на село на мапі, щоб побачити лише його новини й маршрути.' },
    ],
  },
  {
    id: 'sections',
    label: 'Заголовки розділів',
    fields: [
      { key: 'sections_feed', label: 'Стрічка новин', default: 'Новини громади' },
      { key: 'sections_routes', label: 'Маршрути', default: 'Маршрути' },
      { key: 'sections_places', label: 'Місця', default: 'Місця, які варто побачити' },
    ],
  },
  {
    id: 'story',
    label: 'Зелений блок (історія)',
    fields: [
      { key: 'story_title', label: 'Заголовок', default: 'Чому кручі білі' },
      {
        key: 'story_p1',
        label: 'Перший абзац',
        default: 'Схили правого берега Дінця здаються крейдяними, але це чисті кварцові піски берекського регіоярусу.',
        multiline: true,
      },
      {
        key: 'story_p2',
        label: 'Другий абзац (можна лишити порожнім)',
        default: 'Справжня крейда виходить на поверхню найближче біля Геївки, на Шебелинці.',
        multiline: true,
      },
    ],
  },
  {
    id: 'footer',
    label: 'Футер і контакти',
    fields: [
      { key: 'footer_about', label: 'Про сайт (після назви)', default: '— незалежний вебресурс про Зміївську громаду.' },
      {
        key: 'footer_note',
        label: 'Примітка про джерела',
        default: 'Новини — заголовки й посилання на джерела. Мапа схематична. © учасники OpenStreetMap.',
        multiline: true,
      },
      { key: 'footer_contact', label: 'Контакт для новин (email або @telegram, можна порожнім)', default: '' },
    ],
  },
]

export const SETTING_FIELDS = new Map(SETTING_GROUPS.flatMap((g) => g.fields).map((f) => [f.key, f]))

export type SiteSettings = Record<string, string>

/** All site texts: saved value if present (an empty string is a valid value), default otherwise. */
export async function getSiteSettings(): Promise<SiteSettings> {
  const rows: { key: string; value: string | null }[] = await knex('settings').select('key', 'value')
  const saved = new Map(rows.map((r) => [r.key, r.value ?? '']))
  const out: SiteSettings = {}
  for (const [key, field] of SETTING_FIELDS) out[key] = saved.get(key) ?? field.default
  return out
}
