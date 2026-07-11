// ─────────────────────────────────────────────────────────────────────────
//  Utilidades compartidas de la API de sorteos con registro (Cloudflare D1)
//  Los archivos con prefijo "_" NO se publican como rutas.
// ─────────────────────────────────────────────────────────────────────────

// Tipos mínimos de D1 para no depender de @cloudflare/workers-types
export interface D1Result<T = unknown> {
  results: T[]
}
export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement
  first<T = unknown>(): Promise<T | null>
  run(): Promise<{ meta: { changes: number } }>
  all<T = unknown>(): Promise<D1Result<T>>
}
export interface D1Database {
  prepare(query: string): D1PreparedStatement
  batch(stmts: D1PreparedStatement[]): Promise<unknown>
}

export interface Env {
  DB?: D1Database
}

// ── Reglas del producto ──────────────────────────────────────────────────
export const TTL_HOURS = 24 // todo sorteo se borra a las 24 h
export const MAX_PARTICIPANTS = 500
export const DAILY_RAFFLE_CAP = 40 // sorteos nuevos por día (global)
export const CREATE_PER_IP_DAY = 5 // sorteos nuevos por IP por día
export const JOIN_PER_IP_RAFFLE = 10 // registros por IP en un mismo sorteo
export const PIN_MAX_ATTEMPTS = 3 // intentos de PIN fallidos…
export const PIN_WINDOW_SECS = 3600 // …por hora, por IP y sorteo

export const MSG_FULL_CAP =
  'Por el momento la memoria de almacenamiento está llena con otros sorteos. Intenta de nuevo en 24 horas.'

// ── Filas de la base ─────────────────────────────────────────────────────
export interface RaffleRow {
  slug: string
  title: string
  pin: string | null
  admin_token: string
  status: 'open' | 'closed'
  created_at: number
  expires_at: number
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    },
  })
}

export function err(message: string, status: number): Response {
  return json({ ok: false, error: message }, status)
}

export function now(): number {
  return Math.floor(Date.now() / 1000)
}

export function clientIp(request: Request): string {
  return request.headers.get('cf-connecting-ip') || 'anon'
}

/** Lee el body JSON con límite de tamaño (anti-abuso). */
export async function readJson(request: Request, maxBytes = 4096): Promise<Record<string, unknown> | null> {
  const len = Number(request.headers.get('content-length') || '0')
  if (len > maxBytes) return null
  try {
    const text = await request.text()
    if (text.length > maxBytes) return null
    const data = JSON.parse(text)
    return data && typeof data === 'object' && !Array.isArray(data) ? data : null
  } catch {
    return null
  }
}

// ── Validación de entradas (todo se valida SIEMPRE en el servidor) ──────
const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/
const RESERVED_SLUGS = new Set(['api', 'admin', 'assets', 'icons', 'sw', 'nuevo', 's'])

// Caracteres de control e invisibles (zero-width, BOM, separadores raros)
const INVISIBLE_RE = new RegExp(
  '[\\u0000-\\u001f\\u007f\\u200b-\\u200f\\u2028\\u2029\\u202a-\\u202e\\ufeff]',
  'g',
)

export function normalizeSlug(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const slug = raw.trim().toLowerCase()
  if (slug.length < 2 || slug.length > 40) return null
  if (!SLUG_RE.test(slug) || RESERVED_SLUGS.has(slug)) return null
  return slug
}

export function normalizeName(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const name = raw.replace(INVISIBLE_RE, '').replace(/\s+/g, ' ').trim().slice(0, 40)
  if (name.length < 1) return null
  if (!/[\p{L}\p{N}]/u.test(name)) return null // debe tener letra o número
  return name
}

export function normalizeTitle(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const title = raw.replace(INVISIBLE_RE, '').replace(/\s+/g, ' ').trim().slice(0, 60)
  return title.length >= 1 ? title : null
}

export function normalizePin(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  return /^\d{4}$/.test(raw) ? raw : null
}

// ── Aleatorios seguros ───────────────────────────────────────────────────
export function randomToken(): string {
  const buf = new Uint8Array(16)
  crypto.getRandomValues(buf)
  return Array.from(buf, (b) => b.toString(16).padStart(2, '0')).join('')
}

export function randomSlug(): string {
  const alphabet = 'abcdefghjkmnpqrstuvwxyz23456789' // sin caracteres confusos
  const buf = new Uint8Array(6)
  crypto.getRandomValues(buf)
  return Array.from(buf, (b) => alphabet[b % alphabet.length]).join('')
}

/** Comparación en tiempo constante para tokens/PINs. */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

// ── Esquema (se asegura una vez por isolate) ─────────────────────────────
let schemaReady: Promise<void> | null = null

export function ensureSchema(db: D1Database): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      await db.batch([
        db.prepare(`CREATE TABLE IF NOT EXISTS raffles (
          slug TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          pin TEXT,
          admin_token TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'open',
          created_at INTEGER NOT NULL,
          expires_at INTEGER NOT NULL
        )`),
        db.prepare(`CREATE TABLE IF NOT EXISTS participants (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          slug TEXT NOT NULL,
          name TEXT NOT NULL,
          created_at INTEGER NOT NULL
        )`),
        db.prepare(`CREATE INDEX IF NOT EXISTS idx_participants_slug ON participants(slug)`),
        db.prepare(`CREATE TABLE IF NOT EXISTS rate_limits (
          key TEXT PRIMARY KEY,
          count INTEGER NOT NULL,
          window_start INTEGER NOT NULL
        )`),
      ])
    })().catch((e) => {
      schemaReady = null
      throw e
    })
  }
  return schemaReady
}

/** Borra sorteos caducados (24 h) y contadores de rate-limit viejos. */
export async function cleanupExpired(db: D1Database): Promise<void> {
  const t = now()
  await db.batch([
    db.prepare(`DELETE FROM participants WHERE slug IN (SELECT slug FROM raffles WHERE expires_at < ?1)`).bind(t),
    db.prepare(`DELETE FROM raffles WHERE expires_at < ?1`).bind(t),
    db.prepare(`DELETE FROM rate_limits WHERE window_start < ?1`).bind(t - 86_400),
  ])
}

/**
 * Rate-limit por ventana fija guardado en D1.
 * Devuelve true si la acción está permitida (y la cuenta).
 */
export async function allowRate(
  db: D1Database,
  key: string,
  max: number,
  windowSecs: number,
): Promise<boolean> {
  const t = now()
  const row = await db
    .prepare(`SELECT count, window_start FROM rate_limits WHERE key = ?1`)
    .bind(key)
    .first<{ count: number; window_start: number }>()

  if (!row || t - row.window_start >= windowSecs) {
    await db
      .prepare(
        `INSERT INTO rate_limits (key, count, window_start) VALUES (?1, 1, ?2)
         ON CONFLICT(key) DO UPDATE SET count = 1, window_start = ?2`,
      )
      .bind(key, t)
      .run()
    return true
  }
  if (row.count >= max) return false
  await db.prepare(`UPDATE rate_limits SET count = count + 1 WHERE key = ?1`).bind(key).run()
  return true
}

/** Cuántos intentos lleva una clave en su ventana actual (sin incrementar). */
export async function rateCount(db: D1Database, key: string, windowSecs: number): Promise<number> {
  const t = now()
  const row = await db
    .prepare(`SELECT count, window_start FROM rate_limits WHERE key = ?1`)
    .bind(key)
    .first<{ count: number; window_start: number }>()
  if (!row || t - row.window_start >= windowSecs) return 0
  return row.count
}

export async function getRaffle(db: D1Database, slug: string): Promise<RaffleRow | null> {
  const row = await db.prepare(`SELECT * FROM raffles WHERE slug = ?1`).bind(slug).first<RaffleRow>()
  if (!row) return null
  if (row.expires_at < now()) return null // caducado (la limpieza lo borrará)
  return row
}

export async function participantCount(db: D1Database, slug: string): Promise<number> {
  const row = await db
    .prepare(`SELECT COUNT(*) AS c FROM participants WHERE slug = ?1`)
    .bind(slug)
    .first<{ c: number }>()
  return row?.c ?? 0
}

/** Info pública de un sorteo (lo que ve cualquiera con el link). */
export function publicInfo(r: RaffleRow, count: number) {
  return {
    ok: true,
    slug: r.slug,
    title: r.title,
    isPrivate: r.pin !== null,
    status: r.status,
    count,
    max: MAX_PARTICIPANTS,
    expiresAt: r.expires_at,
  }
}

/** Respuesta estándar cuando falta la base de datos (binding DB). */
export function dbMissing(): Response {
  return err('El servicio de sorteos con registro no está configurado todavía.', 503)
}
