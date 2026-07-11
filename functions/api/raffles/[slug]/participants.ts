// GET /api/raffles/:slug/participants?token=… — lista completa (solo organizador)
import {
  Env,
  err,
  json,
  normalizeSlug,
  safeEqual,
  ensureSchema,
  getRaffle,
  publicInfo,
  dbMissing,
} from '../../_utils'

export async function onRequestGet(context: {
  request: Request
  env: Env
  params: { slug: string }
}): Promise<Response> {
  const { request, env, params } = context
  const db = env.DB
  if (!db) return dbMissing()
  await ensureSchema(db)

  const slug = normalizeSlug(params.slug)
  if (!slug) return err('Este sorteo no existe o ya terminó.', 404)

  const token = new URL(request.url).searchParams.get('token') || ''
  const raffle = await getRaffle(db, slug)
  if (!raffle) return err('Este sorteo no existe o ya terminó.', 404)
  if (token.length !== 32 || !safeEqual(raffle.admin_token, token)) {
    return err('No autorizado.', 403)
  }

  const { results } = await db
    .prepare(`SELECT id, name FROM participants WHERE slug = ?1 ORDER BY id ASC`)
    .bind(slug)
    .all<{ id: number; name: string }>()

  return json({ ...publicInfo(raffle, results.length), participants: results })
}
