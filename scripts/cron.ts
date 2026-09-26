import path from 'node:path'
import { config as loadEnv } from 'dotenv'

loadEnv({ path: path.resolve(process.cwd(), '.env.local') })
loadEnv({ path: path.resolve(process.cwd(), '.env') })

import cron from 'node-cron'
import { knex } from '../src/lib/knex'
import { collectAll } from '../src/lib/collectors'

const ONCE = process.argv.includes('--once')
const TICK_SCHEDULE = process.env.CRON_TICK || '*/30 * * * *'

let running = false

async function tick() {
  if (running) return
  running = true
  try {
    const stats = await collectAll()
    for (const s of stats) {
      console.log(
        `[collect] ${s.source}: fetched=${s.fetched} inserted=${s.inserted} skipped=${JSON.stringify(s.skipped)}${s.error ? ` error=${s.error}` : ''}`,
      )
    }
  } finally {
    running = false
  }
}

if (ONCE) {
  tick().finally(() => knex.destroy())
} else {
  console.log(`[cron] collectors scheduled: ${TICK_SCHEDULE}`)
  cron.schedule(TICK_SCHEDULE, tick, { timezone: 'Europe/Kyiv' })
  tick()
}
