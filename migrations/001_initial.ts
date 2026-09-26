import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('settlements', (t) => {
    t.increments('id').primary()
    t.string('slug', 64).notNullable().unique()
    t.string('name', 128).notNullable()
    t.enu('kind', ['city', 'village']).notNullable().defaultTo('village')
    // Position on the schematic SVG map (viewBox 0 0 560 420)
    t.integer('map_x').notNullable()
    t.integer('map_y').notNullable()
    t.integer('label_x').notNullable()
    t.integer('label_y').notNullable()
    // Comma-separated word stems used to tag feed items, e.g. "задонецьк,задонецьке"
    t.string('keywords', 512).notNullable().defaultTo('')
    t.integer('sort_order').notNullable().defaultTo(0)
    t.timestamps(true, true)
  })

  await knex.schema.createTable('sources', (t) => {
    t.increments('id').primary()
    t.string('name', 128).notNullable()
    t.enu('type', ['rss', 'telegram', 'youtube']).notNullable()
    // rss/youtube: feed URL; telegram: channel handle without @
    t.string('url', 512).notNullable()
    t.string('site_url', 512).nullable()
    t.boolean('enabled').notNullable().defaultTo(true)
    // Regional sources: keep only items that mention Zmiiv or a settlement
    t.boolean('require_keyword').notNullable().defaultTo(false)
    t.integer('default_settlement_id').unsigned().nullable().references('settlements.id').onDelete('SET NULL')
    t.dateTime('last_fetched_at').nullable()
    t.string('last_error', 1024).nullable()
    t.timestamps(true, true)
  })

  await knex.schema.createTable('items', (t) => {
    t.increments('id').primary()
    t.integer('source_id').unsigned().notNullable().references('sources.id').onDelete('CASCADE')
    t.integer('settlement_id').unsigned().nullable().references('settlements.id').onDelete('SET NULL')
    t.string('title', 512).notNullable()
    t.text('excerpt').nullable()
    t.string('url', 1024).notNullable()
    t.specificType('url_hash', 'CHAR(64)').notNullable().unique()
    t.string('thumb_url', 1024).nullable()
    t.dateTime('published_at').notNullable()
    t.enu('status', ['published', 'hidden']).notNullable().defaultTo('published')
    t.boolean('pinned').notNullable().defaultTo(false)
    t.boolean('is_demo').notNullable().defaultTo(false)
    t.timestamps(true, true)
    t.index(['status', 'published_at'])
    t.index(['settlement_id', 'published_at'])
  })

  await knex.schema.createTable('routes', (t) => {
    t.increments('id').primary()
    t.integer('settlement_id').unsigned().nullable().references('settlements.id').onDelete('SET NULL')
    t.string('slug', 128).notNullable().unique()
    t.string('title', 256).notNullable()
    t.enu('kind', ['hike', 'eco_trail', 'bike', 'water']).notNullable().defaultTo('hike')
    t.decimal('length_km', 5, 1).nullable()
    t.integer('elevation_m').nullable()
    t.text('description').nullable()
    t.string('source_url', 1024).nullable()
    t.integer('sort_order').notNullable().defaultTo(0)
    t.timestamps(true, true)
  })

  await knex.schema.createTable('places', (t) => {
    t.increments('id').primary()
    t.integer('settlement_id').unsigned().nullable().references('settlements.id').onDelete('SET NULL')
    t.string('slug', 128).notNullable().unique()
    t.string('name', 256).notNullable()
    t.string('kind', 64).notNullable()
    t.text('description').nullable()
    // Required for reused free-licensed text/media, e.g. "Вікіпедія, CC BY-SA 4.0"
    t.string('attribution', 512).nullable()
    t.integer('sort_order').notNullable().defaultTo(0)
    t.timestamps(true, true)
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('places')
  await knex.schema.dropTableIfExists('routes')
  await knex.schema.dropTableIfExists('items')
  await knex.schema.dropTableIfExists('sources')
  await knex.schema.dropTableIfExists('settlements')
}
