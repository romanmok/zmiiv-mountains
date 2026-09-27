import type { Knex } from 'knex'

// Routes get their own page: full Markdown body with photos/videos + a cover. `description` stays the short card summary.
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('routes', (t) => {
    t.text('body', 'longtext').nullable()
    t.string('cover_url', 1024).nullable()
  })

  // Every uploaded file, so media can be listed/cleaned up later regardless of storage (S3 or local disk)
  await knex.schema.createTable('media', (t) => {
    t.increments('id').primary()
    t.enu('kind', ['image', 'video']).notNullable()
    t.string('storage', 16).notNullable()
    t.string('storage_key', 512).notNullable()
    t.string('url', 1024).notNullable()
    t.string('mime', 128).notNullable()
    t.integer('bytes').unsigned().notNullable()
    t.integer('width').unsigned().nullable()
    t.integer('height').unsigned().nullable()
    t.string('original_name', 256).nullable()
    t.integer('uploaded_by').unsigned().nullable().references('users.id').onDelete('SET NULL')
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now())
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('media')
  await knex.schema.alterTable('routes', (t) => {
    t.dropColumn('body')
    t.dropColumn('cover_url')
  })
}
