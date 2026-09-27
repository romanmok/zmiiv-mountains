import type { Knex } from 'knex'

// Zmiiv pin moves from the northern outskirts to the city centre at the Mzha–Donets confluence (OSM 49.672, 36.367)
export async function up(knex: Knex): Promise<void> {
  await knex('settlements').where({ slug: 'zmiiv' }).update({ map_x: 204, map_y: 143, label_x: 140, label_y: 120 })
}

export async function down(knex: Knex): Promise<void> {
  await knex('settlements').where({ slug: 'zmiiv' }).update({ map_x: 198, map_y: 62, label_x: 218, label_y: 67 })
}
