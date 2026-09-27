import type { Knex } from 'knex'

// «Коропове» was a mistake: there is no such village near Zmiiv. The pin is Korobiv Khutir (Saltiv hillfort «Коробові Хутори»).
// Keyword stems match by substring: «коробов» covers Коробові/Коробового and Russian «Коробов Хутор».
export async function up(knex: Knex): Promise<void> {
  await knex('settlements')
    .where({ slug: 'koropove' })
    .update({ slug: 'korobiv-khutir', name: 'Коробів Хутір', keywords: 'коробів,коробов' })
  await knex('routes').where({ slug: 'koropove-horodyshche' }).update({ slug: 'korobovi-khutory-horodyshche' })
}

export async function down(knex: Knex): Promise<void> {
  await knex('settlements').where({ slug: 'korobiv-khutir' }).update({ slug: 'koropove', name: 'Коропове', keywords: 'коропов' })
  await knex('routes').where({ slug: 'korobovi-khutory-horodyshche' }).update({ slug: 'koropove-horodyshche' })
}
