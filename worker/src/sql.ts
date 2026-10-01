/**
 * The SQL the Worker needs, over D1 in production and node:sqlite in tests (test/helpers.ts).
 * Both are SQLite, so the statements are the same.
 */
export interface Sql {
  all<T = Record<string, unknown>>(query: string, ...params: unknown[]): Promise<T[]>
  /** Runs one statement and returns how many rows it changed. */
  run(query: string, ...params: unknown[]): Promise<number>
  /** Runs the statements in one transaction (one round trip on D1) and returns each one's rows (for RETURNING). */
  batch(statements: [string, ...unknown[]][]): Promise<Record<string, unknown>[][]>
  /** The database's size in bytes, when the driver reports it. */
  size(): Promise<number | null>
}

export function d1Sql(db: D1Database): Sql {
  return {
    async all<T>(query: string, ...params: unknown[]) {
      return (await db.prepare(query).bind(...params).all<T>()).results
    },
    async run(query, ...params) {
      return (await db.prepare(query).bind(...params).run()).meta.changes ?? 0
    },
    async batch(statements) {
      if (!statements.length) return []
      const results = await db.batch<Record<string, unknown>>(statements.map(([q, ...p]) => db.prepare(q).bind(...p)))
      return results.map(r => r.results ?? [])
    },
    async size() {
      const { meta } = await db.prepare('SELECT 1').run()
      return typeof meta.size_after === 'number' ? meta.size_after : null
    },
  }
}
