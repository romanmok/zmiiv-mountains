import KnexFactory, { type Knex } from 'knex'
import knexConfig from '../../knexfile'

type GlobalKnex = typeof globalThis & { _knex?: Knex }
const g = globalThis as GlobalKnex

export const knex: Knex = g._knex ?? KnexFactory(knexConfig)

if (process.env.NODE_ENV !== 'production') {
  g._knex = knex
}

export default knex
