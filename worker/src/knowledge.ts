/**
 * The knowledge the chat is grounded in: 6 government schemes (data/schemes.json, a copy of
 * backend/data/schemes.json) and 8 farming notes (data/agri_knowledge.json, a copy of
 * ai-service/data/agri_knowledge.json), plus the Hindi and Punjabi scheme fields in
 * data/schemes.local.json.
 *
 * Retrieval: each passage is embedded once with Workers AI bge-m3 and the vectors are kept in D1
 * (table passages). meta.knowledge_hash is SHA-256 of the model name and every passage, so editing
 * a data file or changing EMBED_MODEL re-embeds everything on the next question. A question is
 * embedded the same way and the top 3 passages at or above the similarity floor go into the prompt.
 */
import notesData from '../data/agri_knowledge.json'
import schemesData from '../data/schemes.json'
import localData from '../data/schemes.local.json'
import type { Lang, Scheme, Source } from './contract'
import type { AiRunner } from './http'
import { sha256hex } from './keys'
import type { Sql } from './sql'

type Localised = Record<Lang, string>
interface SchemeRow {
  id: string; name: Localised; category: string; summary: Localised
  eligibility: string; how_to_apply: string; official_link?: string | null
}
const SCHEMES = schemesData as SchemeRow[]
const LOCAL = localData as unknown as Record<string, { eligibility: Partial<Localised>; how_to_apply: Partial<Localised> }>

export const DEFAULT_EMBED_MODEL = '@cf/baai/bge-m3'
export const TOP_K = 3
export const DEFAULT_MIN_SCORE = 0.4

export interface Passage { id: string; kind: 'scheme' | 'note'; refId: string; text: string }

export const PASSAGES: Passage[] = [
  ...SCHEMES.map(s => ({
    id: `scheme:${s.id}`, kind: 'scheme' as const, refId: s.id,
    text: `${s.name.en} (${s.name.hi} / ${s.name.pa}): ${s.summary.en} Eligibility: ${s.eligibility} How to apply: ${s.how_to_apply}` +
      (s.official_link ? ` Official site: ${s.official_link}` : ''),
  })),
  ...(notesData as { id: string; text: string }[]).map(n => ({ id: `note:${n.id}`, kind: 'note' as const, refId: n.id, text: n.text })),
]

/** The six schemes in one language (GET /api/schemes). */
export function schemesFor(lang: Lang): Scheme[] {
  return SCHEMES.map(s => ({
    id: s.id,
    category: s.category,
    name: s.name[lang] ?? s.name.en,
    summary: s.summary[lang] ?? s.summary.en,
    eligibility: (lang !== 'en' && LOCAL[s.id]?.eligibility[lang]) || s.eligibility,
    howToApply: (lang !== 'en' && LOCAL[s.id]?.how_to_apply[lang]) || s.how_to_apply,
    link: s.official_link ?? null,
  }))
}

/** A scheme passage as a chip the app links to the Schemes tab. */
export function sourceFor(p: Passage, lang: Lang): Source | null {
  if (p.kind !== 'scheme') return null
  const s = SCHEMES.find(x => x.id === p.refId)
  return s ? { id: s.id, kind: 'scheme', title: s.name[lang] ?? s.name.en } : null
}

const unit = (v: number[]) => {
  const n = Math.hypot(...v) || 1
  return v.map(x => x / n)
}
const dot = (a: number[], b: number[]) => {
  let s = 0
  for (let i = 0; i < Math.min(a.length, b.length); i++) s += a[i] * b[i]
  return s
}

/** Workers AI embeddings for `texts`, unit length. Throws when the answer has the wrong shape. */
export async function embed(ai: AiRunner, model: string, texts: string[]): Promise<number[][]> {
  const out = (await ai.run(model, { text: texts })) as { data?: unknown; response?: unknown }
  const rows = Array.isArray(out?.data) ? out.data : Array.isArray(out?.response) ? out.response : null
  if (!rows || rows.length !== texts.length || !rows.every(r => Array.isArray(r) && r.length > 0 && r.every(x => typeof x === 'number'))) {
    throw new Error('embedding: unexpected response')
  }
  return (rows as number[][]).map(unit)
}

export async function knowledgeHash(model: string) {
  return sha256hex(model + '\n' + JSON.stringify(PASSAGES.map(p => [p.id, p.text])))
}

/** Passage vectors, cached in memory per isolate and in D1 across isolates. */
export class Knowledge {
  private memo: { hash: string; vectors: Map<string, number[]> } | null = null

  async vectors(sql: Sql, ai: AiRunner, model: string): Promise<Map<string, number[]>> {
    const hash = await knowledgeHash(model)
    if (this.memo?.hash === hash) return this.memo.vectors
    const [meta] = await sql.all<{ value: string }>("SELECT value FROM meta WHERE key = 'knowledge_hash'")
    let vectors = new Map<string, number[]>()
    if (meta?.value === hash) {
      const rows = await sql.all<{ id: string; vector: string }>('SELECT id, vector FROM passages')
      vectors = new Map(rows.map(r => [r.id, JSON.parse(r.vector) as number[]]))
    }
    if (PASSAGES.some(p => !vectors.has(p.id))) {
      const embedded = await embed(ai, model, PASSAGES.map(p => p.text))
      vectors = new Map(PASSAGES.map((p, i) => [p.id, embedded[i].map(x => Math.round(x * 1e6) / 1e6)]))
      await sql.batch([
        ['DELETE FROM passages'],
        ...PASSAGES.map(p => ['INSERT INTO passages (id, vector) VALUES (?, ?)', p.id, JSON.stringify(vectors.get(p.id))] as [string, ...unknown[]]),
        ["INSERT INTO meta (key, value) VALUES ('knowledge_hash', ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value", hash],
      ])
    }
    this.memo = { hash, vectors }
    return vectors
  }

  /** The best passages for a question, best first. Empty when embeddings are unavailable. */
  async retrieve(question: string, sql: Sql, ai: AiRunner | undefined, model: string, minScore: number): Promise<{ passage: Passage; score: number }[]> {
    if (!ai) return []
    try {
      const vectors = await this.vectors(sql, ai, model)
      const [q] = await embed(ai, model, [question])
      return PASSAGES.map(passage => ({ passage, score: dot(q, vectors.get(passage.id) ?? []) }))
        .filter(r => r.score >= minScore)
        .sort((a, b) => b.score - a.score)
        .slice(0, TOP_K)
    } catch (e) {
      console.error('retrieval', e)
      return [] // answer without passages rather than not at all
    }
  }
}
