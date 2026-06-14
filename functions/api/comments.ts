// ─────────────────────────────────────────────────────────────────────────
//  Cloudflare Pages Function — /api/comments   (PREPARADA, INACTIVA)
// ─────────────────────────────────────────────────────────────────────────
//
//  Este archivo está listo pero el front usa el proveedor MOCK por ahora
//  (ver src/lib/comments.ts). Para activarlo de verdad:
//    1) Crea tu API key gratis en app.scrapecreators.com
//    2) En Cloudflare Pages → Settings → Environment variables, añade:
//         SCRAPECREATORS_API_KEY = tu_key
//       (opcional, recomendado para rate-limit real entre visitas:
//         crea un KV namespace y enlázalo como  RATE_LIMIT )
//    3) En src/lib/comments.ts cambia:
//         export const commentsProvider = scrapeCreatorsProvider
//    4) Despliega (la carpeta functions/ se sube junto al sitio).
//
//  La API key NUNCA llega al navegador: vive solo aquí, en el servidor.
//  No usa base de datos; el rate-limit usa KV si existe, o memoria si no.

interface Env {
  SCRAPECREATORS_API_KEY?: string
  RATE_LIMIT?: KVNamespace
}

type Platform = 'instagram' | 'tiktok' | 'facebook'

const MAX_AMOUNT = 500
const DAILY_LIMIT = 10 // sorteos por IP por día
const COOLDOWN_MS = 30_000 // 30s entre llamadas del mismo IP

const ENDPOINTS: Record<Platform, string> = {
  instagram: 'https://api.scrapecreators.com/v1/instagram/post/comments/simple',
  tiktok: 'https://api.scrapecreators.com/v1/tiktok/post/comments',
  facebook: 'https://api.scrapecreators.com/v1/facebook/post/comments',
}

const HOST_PATTERNS: Record<Platform, RegExp> = {
  instagram: /(^|\.)instagram\.com$/i,
  tiktok: /(^|\.)tiktok\.com$/i,
  facebook: /(^|\.)(facebook\.com|fb\.watch|fb\.com)$/i,
}

// Respaldo en memoria (por isolate; se reinicia). KV es lo robusto entre visitas.
const memCooldown = new Map<string, number>()
const memDaily = new Map<string, { day: string; count: number }>()

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

async function checkLimits(env: Env, ip: string): Promise<string | null> {
  const now = Date.now()
  const cdKey = `cd:${ip}`
  const dayKey = `day:${ip}:${today()}`

  if (env.RATE_LIMIT) {
    const last = await env.RATE_LIMIT.get(cdKey)
    if (last && now - Number(last) < COOLDOWN_MS) {
      const secs = Math.ceil((COOLDOWN_MS - (now - Number(last))) / 1000)
      return `Demasiadas peticiones, intenta en ${secs} segundos.`
    }
    const count = Number((await env.RATE_LIMIT.get(dayKey)) || '0')
    if (count >= DAILY_LIMIT) return 'Llegaste al límite de sorteos por hoy. Vuelve mañana.'
    await env.RATE_LIMIT.put(cdKey, String(now), { expirationTtl: 60 })
    await env.RATE_LIMIT.put(dayKey, String(count + 1), { expirationTtl: 86_400 })
    return null
  }

  // Respaldo en memoria
  const last = memCooldown.get(ip)
  if (last && now - last < COOLDOWN_MS) {
    const secs = Math.ceil((COOLDOWN_MS - (now - last)) / 1000)
    return `Demasiadas peticiones, intenta en ${secs} segundos.`
  }
  const d = memDaily.get(ip)
  const day = today()
  const count = d && d.day === day ? d.count : 0
  if (count >= DAILY_LIMIT) return 'Llegaste al límite de sorteos por hoy. Vuelve mañana.'
  memCooldown.set(ip, now)
  memDaily.set(ip, { day, count: count + 1 })
  return null
}

function validUrl(platform: Platform, raw: string): boolean {
  try {
    const u = new URL(raw)
    return HOST_PATTERNS[platform].test(u.hostname)
  } catch {
    return false
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalize(data: any) {
  const list = Array.isArray(data?.comments) ? data.comments : []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return list.slice(0, MAX_AMOUNT).map((c: any, i: number) => ({
    id: c.id ?? `${i}_${c?.user?.username ?? 'user'}`,
    text: String(c.text ?? ''),
    username: c?.user?.username ?? c?.username ?? 'usuario',
    profilePicUrl: c?.user?.profile_pic_url ?? c?.profile_pic_url ?? undefined,
  }))
}

export async function onRequestGet(context: {
  request: Request
  env: Env
}): Promise<Response> {
  const { request, env } = context
  const { searchParams } = new URL(request.url)
  const platform = searchParams.get('platform') as Platform | null
  const url = searchParams.get('url') || ''

  if (!platform || !(platform in ENDPOINTS)) {
    return json({ success: false, error: 'Red social no válida.' }, 400)
  }
  if (!validUrl(platform, url)) {
    return json({ success: false, error: 'Link inválido, verifica el URL.' }, 400)
  }
  if (!env.SCRAPECREATORS_API_KEY) {
    return json({ success: false, error: 'El servicio no está configurado todavía.' }, 503)
  }

  const ip =
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for') ||
    'anon'
  const limitMsg = await checkLimits(env, ip)
  if (limitMsg) return json({ success: false, error: limitMsg }, 429)

  const target = new URL(ENDPOINTS[platform])
  target.searchParams.set('url', url)
  if (platform === 'instagram') target.searchParams.set('amount', String(MAX_AMOUNT))

  try {
    const res = await fetch(target.toString(), {
      headers: { 'x-api-key': env.SCRAPECREATORS_API_KEY },
    })
    if (res.status === 404) {
      return json({ success: false, error: 'No encontramos ese post. Revisa el link.' }, 404)
    }
    if (res.status === 403 || res.status === 401) {
      return json({ success: false, error: 'Post privado, no podemos leer los comentarios.' }, 403)
    }
    if (!res.ok) {
      return json({ success: false, error: 'El servicio de comentarios falló. Intenta luego.' }, 502)
    }
    const data = await res.json()
    const comments = normalize(data)
    if (comments.length === 0) {
      return json({ success: false, error: 'Este post no tiene comentarios aún.' }, 200)
    }
    return json({ success: true, comments })
  } catch {
    return json({ success: false, error: 'No se pudieron cargar los comentarios.' }, 502)
  }
}

// Tipo mínimo de KV para que el archivo sea autónomo (Cloudflare lo provee real).
interface KVNamespace {
  get(key: string): Promise<string | null>
  put(key: string, value: string, opts?: { expirationTtl?: number }): Promise<void>
}
