import { describe, expect, it } from 'vitest'
import { checkEntry, detectSettlement } from '../filters'

const SETTLEMENTS = [
  { id: 1, keywords: ['зміїв', 'змієв', 'змиев'] },
  { id: 2, keywords: ['задонецьк'] },
  { id: 3, keywords: ['лиман'] },
]

describe('checkEntry', () => {
  it('drops martial-law sensitive posts', () => {
    expect(checkEntry('Повітряна тривога у Змієві', false, SETTLEMENTS)).toMatchObject({ ok: false, reason: 'safety' })
    expect(checkEntry('Гучно: був приліт біля Лимана', false, SETTLEMENTS)).toMatchObject({ ok: false, reason: 'safety' })
  })

  it('drops ads and personal posts', () => {
    expect(checkEntry('Продам гараж у центрі', false, SETTLEMENTS)).toEqual({ ok: false, reason: 'noise', match: 'продам' })
    expect(checkEntry('Знайдено щенка, власник, телефонуйте 0990649859', false, SETTLEMENTS)).toEqual({ ok: false, reason: 'phone' })
    expect(checkEntry('ВАКАНСІЯ | СУШИСТ', false, SETTLEMENTS)).toMatchObject({ ok: false, reason: 'noise', match: 'ваканс' })
  })

  it('requires an area mention for regional sources', () => {
    expect(checkEntry('У Чугуєві відкрили сквер', true, SETTLEMENTS)).toEqual({ ok: false, reason: 'off_topic' })
    expect(checkEntry('У Задонецькому відкрили сквер', true, SETTLEMENTS)).toEqual({ ok: true })
    expect(checkEntry('Новини Змиёва', true, SETTLEMENTS)).toEqual({ ok: true })
  })
})

describe('custom rules', () => {
  it('uses the stop-word lists passed in', () => {
    const rules = { safety: [], noise: ['ярмарок'], blockPhones: false }
    expect(checkEntry('Повітряна тривога', false, SETTLEMENTS, rules)).toEqual({ ok: true })
    expect(checkEntry('Осінній ярмарок', false, SETTLEMENTS, rules)).toMatchObject({ ok: false, reason: 'noise' })
    expect(checkEntry('телефонуйте 0990649859', false, SETTLEMENTS, rules)).toEqual({ ok: true })
  })
})

describe('detectSettlement', () => {
  it('prefers the village over the city', () => {
    expect(detectSettlement('Зміївська громада: у Задонецькому ремонт', SETTLEMENTS)).toBe(2)
  })
  it('returns null without mentions', () => {
    expect(detectSettlement('Погода на вихідні', SETTLEMENTS)).toBeNull()
  })
})
