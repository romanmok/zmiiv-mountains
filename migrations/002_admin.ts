import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('users', (t) => {
    t.increments('id').primary()
    t.string('username', 64).notNullable().unique()
    t.string('password_hash', 255).notNullable()
    t.string('display_name', 128).nullable()
    t.boolean('is_active').notNullable().defaultTo(true)
    t.timestamps(true, true)
  })

  await knex.schema.createTable('sessions', (t) => {
    // sha256 of the cookie token, the raw token never touches the DB
    t.specificType('id', 'CHAR(64)').primary()
    t.integer('user_id').unsigned().notNullable().references('users.id').onDelete('CASCADE')
    t.dateTime('expires_at').notNullable()
    t.string('user_agent', 512).nullable()
    t.string('ip', 64).nullable()
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now())
    t.index(['expires_at'])
  })

  // Site texts editable from /admin/settings (key prefix = section, like maska-theatre)
  await knex.schema.createTable('settings', (t) => {
    t.string('key', 64).primary()
    t.text('value').nullable()
  })

  // Stop-word lists used by the collectors (were constants in filters.ts)
  await knex.schema.createTable('filter_words', (t) => {
    t.increments('id').primary()
    t.enu('kind', ['safety', 'noise']).notNullable()
    t.string('word', 128).notNullable()
    t.unique(['kind', 'word'])
  })

  // pending = waits for review, filtered = dropped by a stop-word rule (kept so admins can rescue it)
  await knex.raw(
    "ALTER TABLE items MODIFY status ENUM('published','hidden','pending','filtered') NOT NULL DEFAULT 'published'",
  )
  await knex.schema.alterTable('items', (t) => {
    t.string('filter_reason', 32).nullable().after('status')
  })

  await knex.schema.alterTable('sources', (t) => {
    // New items from this source go to the moderation queue instead of the feed
    t.boolean('premoderate').notNullable().defaultTo(false).after('require_keyword')
  })

  await knex.schema.alterTable('routes', (t) => {
    t.boolean('is_published').notNullable().defaultTo(true).after('source_url')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('routes', (t) => t.dropColumn('is_published'))
  await knex.schema.alterTable('sources', (t) => t.dropColumn('premoderate'))
  await knex.schema.alterTable('items', (t) => t.dropColumn('filter_reason'))
  await knex('items').whereIn('status', ['pending', 'filtered']).update({ status: 'hidden' })
  await knex.raw("ALTER TABLE items MODIFY status ENUM('published','hidden') NOT NULL DEFAULT 'published'")
  await knex.schema.dropTableIfExists('filter_words')
  await knex.schema.dropTableIfExists('settings')
  await knex.schema.dropTableIfExists('sessions')
  await knex.schema.dropTableIfExists('users')
}
