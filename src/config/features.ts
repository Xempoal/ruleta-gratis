// ─────────────────────────────────────────────────────────────────────────
//  INTERRUPTORES DE FUNCIONES (lo que está "listo pero oculto")
// ─────────────────────────────────────────────────────────────────────────
//
//  Para ACTIVAR una función de forma permanente: cambia false → true aquí,
//  guarda, y reconstruye el sitio:   npm run build   (y vuelve a subir /dist).
//
//  Para PREVISUALIZAR sin recompilar (solo tú, con un link): añade a la URL
//      ?preview=social         → activa el módulo de comentarios
//      ?preview=banner         → activa el banner patrocinado
//      ?preview=social,banner  → ambos
//  El preview NO cambia lo que ve el público; solo afecta a quien abra ese link.
//
export const FEATURES = {
  /** Módulo de sorteo por comentarios de Instagram/TikTok/Facebook */
  socialRaffle: false,
  /** Banner superior "Patrocinado por" (lleva a tu Instagram) */
  sponsorBanner: false,
} as const

export type FeatureKey = keyof typeof FEATURES

/** Mapea ?preview=xxx a las claves de FEATURES */
const PREVIEW_ALIASES: Record<string, FeatureKey> = {
  social: 'socialRaffle',
  socialraffle: 'socialRaffle',
  comentarios: 'socialRaffle',
  banner: 'sponsorBanner',
  sponsor: 'sponsorBanner',
  patrocinado: 'sponsorBanner',
}

function previewSet(): Set<FeatureKey> {
  const set = new Set<FeatureKey>()
  if (typeof window === 'undefined') return set
  const raw = new URLSearchParams(window.location.search).get('preview')
  if (!raw) return set
  for (const token of raw.split(',')) {
    const key = PREVIEW_ALIASES[token.trim().toLowerCase()]
    if (key) set.add(key)
  }
  return set
}

/**
 * ¿Está activa una función? = flag de código  O  override ?preview= en la URL.
 * Se evalúa una sola vez por carga de página.
 */
const PREVIEW = previewSet()

export function isEnabled(key: FeatureKey): boolean {
  return FEATURES[key] || PREVIEW.has(key)
}
