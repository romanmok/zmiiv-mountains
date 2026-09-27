import type { Knex } from 'knex'

// Legends move from one settings block to their own table: the home page shows one random published legend.
// «Змієві вали» (Kyiv-region tale of a hero ploughing with the serpent) is dropped: it is not a legend of this territory.
// Legend texts live in scripts/seed.ts.
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('legends', (t) => {
    t.increments('id').primary()
    t.string('title', 256).notNullable()
    t.text('body').notNullable()
    t.text('note').nullable()
    t.integer('settlement_id').unsigned().nullable().references('settlements.id').onDelete('SET NULL')
    t.string('source_url', 1024).nullable()
    t.boolean('is_published').notNullable().defaultTo(true)
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now())
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now())
  })

  await knex('settings').whereIn('key', ['legend_title', 'legend_text', 'legend_note']).del()
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('legends')
}
