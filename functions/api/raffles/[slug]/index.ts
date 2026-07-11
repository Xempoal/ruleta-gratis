// /api/raffles/:slug
//   GET    → info pública del sorteo (título, estado, cuántos van)
//   PATCH  → acciones del organizador (cerrar/abrir, editar link, concluir)
//   DELETE → concluir el sorteo y borrar todos sus datos
import {
  Env,
  RaffleRow,
  json,
  err,
  clientIp,
  readJson,
  normalizeSlug,
  safeEqual,
  ensureSchema,
  getRaffle,
  participantCount,
  publicInfo,
  allowRate,
  dbMissing,
} from '../../_utils'

interface Ctx {
  request: Request
  env: Env
  params: { slug: string }
}

function slugParam(params: { slug: string }): string | null {
  return normalizeSlug(params.slug)
}

export async function onRequestGet(context: Ctx): Promise<Response> {
  const db = context.env.DB
  if (!db) return dbMissing()
  await ensureSchema(db)

  const slug = slugParam(context.params)
  if (!slug) return err('Sorteo no encontrado.', 404)

  // Anti-scraping ligero: máx 120 consultas/min por IP
  const ip = clientIp(context.request)
  if (!(await allowRate(db, `info:${ip}`, 120, 60))) return err('Demasiadas peticiones.', 429)

  const raffle = await getRaffle(db, slug)
  if (!raffle) return err('Este sorteo no existe o ya terminó.', 404)

  return json(publicInfo(raffle, await participantCount(db, slug)))
}

/** Verifica el token de administrador del sorteo. */
function isAdmin(raffle: RaffleRow, token: unknown): boolean {
  return typeof token === 'string' && token.length === 32 && safeEqual(raffle.admin_token, token)
}

export async function onRequestPatch(context: Ctx): Promise<Response> {
  const db = context.env.DB
  if (!db) return dbMissing()
  await ensureSchema(db)

  const slug = slugParam(context.params)
  if (!slug) return err('Sorteo no encontrado.', 404)

  const body = await readJson(context.request)
  if (!body) return err('Datos inválidos.', 400)

  const raffle = await getRaffle(db, slug)
  if (!raffle) return err('Este sorteo no existe o ya terminó.', 404)
  if (!isAdmin(raffle, body.token)) return err('No autorizado.', 403)

  // Cambiar estado (cerrar/reabrir registro)
  if (body.status === 'open' || body.status === 'closed') {
    await db.prepare(`UPDATE raffles SET status = ?1 WHERE slug = ?2`).bind(body.status, slug).run()
    raffle.status = body.status
  }

  // Editar el link (slug) del sorteo
  if (body.newSlug !== undefined && body.newSlug !== null && body.newSlug !== '') {
    const newSlug = normalizeSlug(body.newSlug)
    if (!newSlug) {
      return err('El link solo puede llevar letras, números y guiones (2-40 caracteres).', 400)
    }
    if (newSlug !== slug) {
      const taken = await db.prepare(`SELECT 1 FROM raffles WHERE slug = ?1`).bind(newSlug).first()
      if (taken) return err('Ese link ya está ocupado por otro sorteo. Prueba con otro nombre.', 409)
      await db.batch([
        db.prepare(`UPDATE raffles SET slug = ?1 WHERE slug = ?2`).bind(newSlug, slug),
        db.prepare(`UPDATE participants SET slug = ?1 WHERE slug = ?2`).bind(newSlug, slug),
      ])
      raffle.slug = newSlug
    }
  }

  return json(publicInfo(raffle, await participantCount(db, raffle.slug)))
}

export async function onRequestDelete(context: Ctx): Promise<Response> {
  const db = context.env.DB
  if (!db) return dbMissing()
  await ensureSchema(db)

  const slug = slugParam(context.params)
  if (!slug) return err('Sorteo no encontrado.', 404)

  const token = new URL(context.request.url).searchParams.get('token')
  const raffle = await getRaffle(db, slug)
  if (!raffle) return json({ ok: true }) // ya no existe: mismo resultado
  if (!isAdmin(raffle, token)) return err('No autorizado.', 403)

  await db.batch([
    db.prepare(`DELETE FROM participants WHERE slug = ?1`).bind(slug),
    db.prepare(`DELETE FROM raffles WHERE slug = ?1`).bind(slug),
  ])
  return json({ ok: true })
}
