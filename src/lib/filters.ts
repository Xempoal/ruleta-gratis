import { SocialComment } from './comments'

export interface FilterOptions {
  /** Un comentario por persona (se queda el primero de cada usuario) */
  dedupe: boolean
  /** Excluir comentarios que contengan alguna de estas palabras */
  excludeWords: string[]
  /** Requerir que el comentario mencione a alguna cuenta (@) */
  requireMention: boolean
  /** Cuenta específica a mencionar (sin @); vacío = cualquier @ */
  mentionText: string
  /** Requerir que el comentario use algún hashtag (#) */
  requireHashtag: boolean
  /** Hashtag específico (sin #); vacío = cualquier # */
  hashtagText: string
}

export const DEFAULT_FILTERS: FilterOptions = {
  dedupe: true,
  excludeWords: [],
  requireMention: false,
  mentionText: '',
  requireHashtag: false,
  hashtagText: '',
}

export function applyFilters(comments: SocialComment[], o: FilterOptions): SocialComment[] {
  const words = o.excludeWords.map((w) => w.trim().toLowerCase()).filter(Boolean)
  const mention = o.mentionText.trim().replace(/^@/, '').toLowerCase()
  const hashtag = o.hashtagText.trim().replace(/^#/, '').toLowerCase()

  const seen = new Set<string>()
  const out: SocialComment[] = []

  for (const c of comments) {
    const text = c.text.toLowerCase()

    if (o.requireMention) {
      if (mention) {
        if (!text.includes('@' + mention)) continue
      } else if (!/@\w/.test(c.text)) continue
    }

    if (o.requireHashtag) {
      if (hashtag) {
        if (!text.includes('#' + hashtag)) continue
      } else if (!/#\w/.test(c.text)) continue
    }

    if (words.length && words.some((w) => text.includes(w))) continue

    if (o.dedupe) {
      const key = c.username.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
    }

    out.push(c)
  }

  return out
}
