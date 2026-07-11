// POST /api/raffles — crear un sorteo con registro por link
import {
  Env,
  TTL_HOURS,
  DAILY_RAFFLE_CAP,
  CREATE_PER_IP_DAY,
  MSG_FULL_CAP,
  json,
  err,
  now,
  clientIp,
  readJson,
  normalizeSlug,
  normalizeTitle,
  normalizePin,
  randomToken,
  randomSlug,
  ensureSchema,
  cleanupExpired,
  allowRate,
  dbMissing,
} from '../_utils'

export async function onRequestPost(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context
  const db = env.DB
  if (!db) return dbMissing()
  await ensureSchema(db)
  await cleanupExpired(db)

  const body = await readJson(request)
  if (!body) return err('Datos inválidos.', 400)

  const title = normalizeTitle(body.title)
  if (!title) return err('Ponle un título al sorteo (máx. 60 caracteres).', 400)

  // PIN opcional: si el sorteo es privado debe ser de 4 dígitos
  let pin: string | null = null
  if (body.pin !== undefined && body.pin !== null && body.pin !== '') {
    pin = normalizePin(body.pin)
    if (!pin) return err('La clave debe ser de exactamente 4 dígitos.', 400)
  }

  // Límite por IP (anti-abuso) y cupo global diario (anti-saturación)
  const ip = clientIp(request)
  if (!(await allowRate(db, `create:${ip}`, CREATE_PER_IP_DAY, 86_400))) {
    return err('Llegaste al límite de sorteos creados por hoy. Intenta mañana.', 429)
  }
  const t = now()
  const todayCount = await db
    .prepare(`SELECT COUNT(*) AS c FROM raffles WHERE created_at > ?1`)
    .bind(t - 86_400)
    .first<{ c: number }>()
  if ((todayCount?.c ?? 0) >= DAILY_RAFFLE_CAP) return err(MSG_FULL_CAP, 503)

  // Slug: el que pida el organizador o uno aleatorio
  let slug: string
  if (body.slug !== undefined && body.slug !== null && body.slug !== '') {
    const requested = normalizeSlug(body.slug)
    if (!requested) {
      return err('El link solo puede llevar letras, números y guiones (2-40 caracteres).', 400)
    }
    slug = requested
  } else {
    slug = randomSlug()
  }

  const adminToken = randomToken()
  try {
    await db
      .prepare(
        `INSERT INTO raffles (slug, title, pin, admin_token, status, created_at, expires_at)
         VALUES (?1, ?2, ?3, ?4, 'open', ?5, ?6)`,
      )
      .bind(slug, title, pin, adminToken, t, t + TTL_HOURS * 3600)
      .run()
  } catch {
    return err('Ese link ya está ocupado por otro sorteo. Prueba con otro nombre.', 409)
  }

  return json({
    ok: true,
    slug,
    title,
    isPrivate: pin !== null,
    pin,
    adminToken,
    expiresAt: t + TTL_HOURS * 3600,
  })
}
