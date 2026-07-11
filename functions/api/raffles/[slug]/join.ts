// POST /api/raffles/:slug/join — registrarse a un sorteo con nombre (+ PIN si es privado)
import {
  Env,
  MAX_PARTICIPANTS,
  JOIN_PER_IP_RAFFLE,
  PIN_MAX_ATTEMPTS,
  PIN_WINDOW_SECS,
  json,
  err,
  now,
  clientIp,
  readJson,
  normalizeSlug,
  normalizeName,
  safeEqual,
  ensureSchema,
  getRaffle,
  participantCount,
  allowRate,
  rateCount,
  dbMissing,
} from '../../_utils'

export async function onRequestPost(context: {
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

  const body = await readJson(request)
  if (!body) return err('Datos inválidos.', 400)

  const raffle = await getRaffle(db, slug)
  if (!raffle) return err('Este sorteo no existe o ya terminó.', 404)
  if (raffle.status !== 'open') return err('El registro de este sorteo ya está cerrado.', 409)

  const ip = clientIp(request)

  // Sorteo privado: exige PIN de 4 dígitos con 3 intentos fallidos por hora
  if (raffle.pin !== null) {
    const attemptKey = `pin:${ip}:${slug}`
    const failed = await rateCount(db, attemptKey, PIN_WINDOW_SECS)
    if (failed >= PIN_MAX_ATTEMPTS) {
      return err('Demasiados intentos de clave. Espera una hora y vuelve a intentar.', 429)
    }
    const pin = typeof body.pin === 'string' ? body.pin.trim() : ''
    if (!/^\d{4}$/.test(pin) || !safeEqual(raffle.pin, pin)) {
      await allowRate(db, attemptKey, PIN_MAX_ATTEMPTS + 1, PIN_WINDOW_SECS) // registra el fallo
      const left = PIN_MAX_ATTEMPTS - failed - 1
      return err(
        left > 0
          ? `Clave incorrecta. Te quedan ${left} intento${left === 1 ? '' : 's'} esta hora.`
          : 'Clave incorrecta. Demasiados intentos: espera una hora.',
        403,
      )
    }
  }

  const name = normalizeName(body.name)
  if (!name) return err('Escribe tu nombre (1 a 40 caracteres).', 400)

  // Límite de registros por IP en el mismo sorteo (anti-spam)
  if (!(await allowRate(db, `join:${ip}:${slug}`, JOIN_PER_IP_RAFFLE, 86_400))) {
    return err('Ya se registraron muchas personas desde tu conexión en este sorteo.', 429)
  }

  const count = await participantCount(db, slug)
  if (count >= MAX_PARTICIPANTS) {
    return err(`Este sorteo ya está lleno (${MAX_PARTICIPANTS} participantes).`, 409)
  }

  // Nombre repetido: pedimos distinguirse (también evita registrarse mil veces)
  const dup = await db
    .prepare(`SELECT 1 FROM participants WHERE slug = ?1 AND name = ?2 COLLATE NOCASE`)
    .bind(slug, name)
    .first()
  if (dup) {
    return err('Ese nombre ya está registrado. Agrega un apellido o apodo para distinguirte.', 409)
  }

  await db
    .prepare(`INSERT INTO participants (slug, name, created_at) VALUES (?1, ?2, ?3)`)
    .bind(slug, name, now())
    .run()

  return json({ ok: true, name, count: count + 1 })
}
