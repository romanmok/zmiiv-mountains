import { describe, expect, it } from 'vitest'
import { checkEntry, detectSettlement } from '../filters'

const SETTLEMENTS = [
  { id: 1, keywords: ['зміїв', 'змієв', 'змиев'] },
  { id: 2, keywords: ['задонецьк'] },
  { id: 3, keywords: ['лиман'] },
]

describe('checkEntry', () => {
  it('drops martial-law sensitive posts', () => {
    expect(checkEntry('Повітряна тривога у Змієві', false, SETTLEMENTS)).toEqual({ ok: false, reason: 'safety' })
    expect(checkEntry('Гучно: був приліт біля Лимана', false, SETTLEMENTS)).toEqual({ ok: false, reason: 'safety' })
  })

  it('drops ads and personal posts', () => {
    expect(checkEntry('Продам гараж у центрі', false, SETTLEMENTS)).toEqual({ ok: false, reason: 'noise' })
    expect(checkEntry('Знайдено щенка, власник, телефонуйте 0990649859', false, SETTLEMENTS)).toEqual({ ok: false, reason: 'noise' })
    expect(checkEntry('ВАКАНСІЯ | СУШИСТ', false, SETTLEMENTS)).toEqual({ ok: false, reason: 'noise' })
  })

  it('requires an area mention for regional sources', () => {
    expect(checkEntry('У Чугуєві відкрили сквер', true, SETTLEMENTS)).toEqual({ ok: false, reason: 'off_topic' })
    expect(checkEntry('У Задонецькому відкрили сквер', true, SETTLEMENTS)).toEqual({ ok: true })
    expect(checkEntry('Новини Змиёва', true, SETTLEMENTS)).toEqual({ ok: true })
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
