import type { Knex } from 'knex'

// The schematic map (viewBox 560x420) is replaced by a real OSM base map (public/map/zmiiv-base.svg, 560x446).
const COORDS: Record<string, [number, number, number, number]> = {
  zmiiv: [198, 62, 218, 67],
  haidary: [102, 264, 118, 269],
  koropove: [171, 366, 187, 371],
  zadonetske: [182, 222, 198, 227],
  lyman: [381, 353, 361, 381],
  slobozhanske: [480, 341, 430, 325],
}

export async function up(knex: Knex): Promise<void> {
  for (const [slug, [map_x, map_y, label_x, label_y]] of Object.entries(COORDS))
    await knex('settlements').where({ slug }).update({ map_x, map_y, label_x, label_y })
}

export async function down(): Promise<void> {
  // Coordinates only: the old schematic positions are not worth restoring
}
