import type { Knex } from 'knex'
import path from 'node:path'
import { config as loadEnv } from 'dotenv'

loadEnv({ path: path.resolve(process.cwd(), '.env.local') })
loadEnv({ path: path.resolve(process.cwd(), '.env') })

const config: Knex.Config = {
  client: 'mysql2',
  connection: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3310),
    database: process.env.DB_NAME || 'zmiiv_mountains',
    user: process.env.DB_USER || 'zmiiv_mountains',
    password: process.env.DB_PASSWORD || 'zmiiv_mountains_dev_pw',
    charset: 'utf8mb4',
    timezone: 'Z',
    dateStrings: true,
  },
  pool: { min: 0, max: 10 },
  migrations: {
    directory: path.resolve(process.cwd(), 'migrations'),
    tableName: 'knex_migrations',
    extension: 'ts',
    loadExtensions: ['.ts', '.js'],
  },
}

export default config
