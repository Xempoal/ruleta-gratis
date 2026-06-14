// Capa de datos del módulo de sorteo por comentarios.
//
// ESTADO ACTUAL: usa `mockProvider` (comentarios falsos en memoria) para que
// TODO el flujo de la interfaz funcione sin gastar dinero ni tocar ninguna red.
//
// PARA ACTIVAR DE VERDAD (más adelante):
//   1) Desplegar la Cloudflare Pages Function de `functions/api/comments.ts`.
//   2) Definir la variable de entorno SCRAPECREATORS_API_KEY en Cloudflare.
//   3) Cambiar la última línea:  export const commentsProvider = scrapeCreatorsProvider
//
export type Platform = 'instagram' | 'tiktok' | 'facebook'

export interface SocialComment {
  id: string
  text: string
  username: string
  profilePicUrl?: string
}

/** Tope gratuito: como máximo procesamos los primeros 500 comentarios. */
export const MAX_COMMENTS = 500

export interface CommentsProvider {
  /** Carga (hasta MAX_COMMENTS) comentarios de un post público. */
  load(platform: Platform, url: string, signal?: AbortSignal): Promise<SocialComment[]>
}

export const PLATFORM_LABELS: Record<Platform, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  facebook: 'Facebook',
}

// Valida en el front que el link sea de la red elegida (antes de cualquier llamada).
const URL_PATTERNS: Record<Platform, RegExp> = {
  instagram: /(^|\.)instagram\.com\//i,
  tiktok: /(^|\.)tiktok\.com\//i,
  facebook: /(^|\.)(facebook\.com|fb\.watch|fb\.com)\//i,
}

export function isValidUrl(platform: Platform, url: string): boolean {
  try {
    const u = new URL(url.trim())
    return URL_PATTERNS[platform].test(u.hostname + '/')
  } catch {
    return false
  }
}

export class CommentsError extends Error {}

/* ───────────────────────── Proveedor REAL (preparado) ─────────────────────── */
// Llama a nuestro backend (Cloudflare Pages Function), que es quien guarda la
// API key de ScrapeCreators. El front NUNCA ve la key.
export const scrapeCreatorsProvider: CommentsProvider = {
  async load(platform, url, signal) {
    const qs = new URLSearchParams({ platform, url, amount: String(MAX_COMMENTS) })
    const res = await fetch(`/api/comments?${qs}`, { signal })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || !data?.success) {
      throw new CommentsError(data?.error || 'No se pudieron cargar los comentarios.')
    }
    return (data.comments as SocialComment[]).slice(0, MAX_COMMENTS)
  },
}

/* ───────────────────────────── Proveedor MOCK ─────────────────────────────── */
const MOCK_NAMES = [
  'maria_lopez', 'juanp', 'sofiagdl', 'el_carlos', 'andrea.ruiz', 'luchooo', 'pao_mtz',
  'dani.flores', 'kary_99', 'rodrigoo', 'val_ramos', 'mauricio_g', 'lizzy.mx', 'pedrooo',
  'gaby_torres', 'cesar.vega', 'mona_lis', 'tonny23', 'ale_jandra', 'beto_r', 'naty.cruz',
  'memo_h', 'fer_solis', 'kris_tina', 'pablo.díaz', 'rosa_bella', 'chuy_m', 'ivanna_p',
  'erick.lara', 'lupita_77', 'santi_go', 'wendy.mx', 'oscar_d', 'tania.r', 'hugo_b',
]
const MOCK_TEXTS = [
  '¡Quiero participar! 🙌', 'Yo yo yo 🥺', 'Participando ✨', 'Suerte a todos 🍀',
  'Ojalá me toque 🙏', '@ana mira esto', '@luis participa conmigo', 'Me encanta 😍',
  '#sorteo va! ', 'Listo, ya te sigo ❤️', 'Va va va 🔥', 'Participo con todo',
  'Sería un sueño ganar', 'Comentario spam compra seguidores', 'Yo quiero porfa 🥹',
  'Etiqueto a @sofia y @memo', 'Aquí presente ✋', 'Cruzo dedos 🤞', 'Me apunto!! ',
  '#sorteo #suerte participando', 'Saludos desde Monterrey', 'Mucha suerte para todos',
]

function mulberry32(seed: number) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const mockProvider: CommentsProvider = {
  async load(platform, url) {
    if (!isValidUrl(platform, url)) {
      throw new CommentsError('Link inválido, verifica el URL del post.')
    }
    // Simula la latencia de la API real (puede tardar en Instagram).
    await new Promise((r) => setTimeout(r, 900))

    const rnd = mulberry32(Array.from(url).reduce((a, c) => a + c.charCodeAt(0), 0))
    const total = 60 + Math.floor(rnd() * 280) // 60–340 comentarios
    const out: SocialComment[] = []
    for (let i = 0; i < total; i++) {
      const username = MOCK_NAMES[Math.floor(rnd() * MOCK_NAMES.length)]
      const text = MOCK_TEXTS[Math.floor(rnd() * MOCK_TEXTS.length)]
      out.push({
        id: `${i}_${username}`,
        text,
        username,
        // Foto demo (si no carga, la UI muestra la inicial).
        profilePicUrl: `https://i.pravatar.cc/80?u=${encodeURIComponent(username + i)}`,
      })
    }
    return out.slice(0, MAX_COMMENTS)
  },
}

// 👉 Proveedor activo. Cambia a `scrapeCreatorsProvider` cuando actives el backend.
export const commentsProvider: CommentsProvider = mockProvider
