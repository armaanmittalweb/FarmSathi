import { createApp, prune, type Bindings } from './app'
import { d1Sql } from './sql'

const app = createApp({ sql: env => d1Sql(env.DB) })

export default {
  fetch: app.fetch,
  // Daily (wrangler.jsonc): chats older than 180 days, expired sessions and old usage counters.
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(prune(d1Sql(env.DB), Date.now()).then(r => console.log('prune', JSON.stringify(r))))
  },
} satisfies ExportedHandler<Bindings>
