import { useMemo, useRef, useState } from 'react'
import {
  Platform,
  PLATFORM_LABELS,
  SocialComment,
  commentsProvider,
  isValidUrl,
  CommentsError,
} from '../../lib/comments'
import { applyFilters, DEFAULT_FILTERS, FilterOptions } from '../../lib/filters'
import { CommentList } from './CommentList'
import { SocialWinner } from './SocialWinner'
import { Confetti } from '../Confetti'

const PLATFORMS: Platform[] = ['instagram', 'tiktok', 'facebook']

const PLACEHOLDER: Record<Platform, string> = {
  instagram: 'https://www.instagram.com/p/XXXXXXXXX/',
  tiktok: 'https://www.tiktok.com/@usuario/video/123456789',
  facebook: 'https://www.facebook.com/usuario/posts/123456789',
}

interface Props {
  accent: string
  colors: string[]
}

export function SocialRaffle({ accent, colors }: Props) {
  const [platform, setPlatform] = useState<Platform>('instagram')
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [comments, setComments] = useState<SocialComment[]>([])
  const [filters, setFilters] = useState<FilterOptions>(DEFAULT_FILTERS)
  const [excludeText, setExcludeText] = useState('')

  const [winner, setWinner] = useState<SocialComment | null>(null)
  const [isSubstitute, setIsSubstitute] = useState(false)
  const [confettiBurst, setConfettiBurst] = useState(0)
  const drawnRef = useRef<Set<string>>(new Set())

  const eligible = useMemo(() => applyFilters(comments, filters), [comments, filters])
  const remaining = eligible.filter((c) => !drawnRef.current.has(c.id))

  const patch = (p: Partial<FilterOptions>) => setFilters((f) => ({ ...f, ...p }))

  async function loadComments() {
    setError(null)
    if (!isValidUrl(platform, url)) {
      setError(`Ese link no parece de ${PLATFORM_LABELS[platform]}. Verifica el URL.`)
      return
    }
    setLoading(true)
    setComments([])
    drawnRef.current = new Set()
    try {
      const data = await commentsProvider.load(platform, url)
      if (data.length === 0) {
        setError('Este post no tiene comentarios aún.')
      }
      setComments(data)
    } catch (e) {
      setError(e instanceof CommentsError ? e.message : 'No se pudieron cargar los comentarios.')
    } finally {
      setLoading(false)
    }
  }

  function pick(): SocialComment | null {
    const pool = eligible.filter((c) => !drawnRef.current.has(c.id))
    if (!pool.length) return null
    return pool[Math.floor(Math.random() * pool.length)]
  }

  function startDraw() {
    const w = pick()
    if (!w) return
    drawnRef.current.add(w.id)
    setIsSubstitute(false)
    setWinner(w)
    setConfettiBurst((b) => b + 1)
  }

  function substitute() {
    const w = pick()
    if (!w) return
    drawnRef.current.add(w.id)
    setIsSubstitute(true)
    setWinner(w)
    setConfettiBurst((b) => b + 1)
  }

  return (
    <section className="social-raffle" style={{ ['--accent' as string]: accent }}>
      <div className="social-card">
        <h2 className="social-title">Sorteo por comentarios</h2>
        <p className="social-sub">
          Pega el link de un post público y carga sus comentarios para sortear.
        </p>

        {/* 1. Red social */}
        <div className="seg-control platform-seg">
          {PLATFORMS.map((p) => (
            <button
              key={p}
              className={platform === p ? 'active' : ''}
              onClick={() => {
                setPlatform(p)
                setError(null)
              }}
              disabled={loading}
            >
              {PLATFORM_LABELS[p]}
            </button>
          ))}
        </div>

        {/* 2. Link */}
        <label className="field">
          <span>Link del post</span>
          <input
            type="url"
            inputMode="url"
            value={url}
            placeholder={PLACEHOLDER[platform]}
            onChange={(e) => setUrl(e.target.value)}
            disabled={loading}
          />
        </label>

        {/* 3. Cargar */}
        <button
          className="spin-btn social-load"
          onClick={loadComments}
          disabled={loading || !url.trim()}
        >
          {loading ? 'Cargando comentarios…' : 'Cargar comentarios'}
        </button>

        {loading && (
          <p className="social-hint">
            Esto puede tardar hasta 60 segundos en posts con muchos comentarios…
          </p>
        )}
        {error && <p className="social-error">{error}</p>}
      </div>

      {comments.length > 0 && (
        <div className="social-card">
          {/* 5. Comentarios */}
          <CommentList comments={eligible} eligible={eligible.length} />

          {/* 6. Filtros */}
          <details className="social-filters">
            <summary>Opciones del sorteo</summary>

            <ToggleRow
              label="Un ganador por persona"
              checked={filters.dedupe}
              onChange={(v) => patch({ dedupe: v })}
            />
            <ToggleRow
              label="Requerir que mencione una cuenta (@)"
              checked={filters.requireMention}
              onChange={(v) => patch({ requireMention: v })}
            />
            {filters.requireMention && (
              <input
                className="social-mini-input"
                placeholder="cuenta exacta (opcional, sin @)"
                value={filters.mentionText}
                onChange={(e) => patch({ mentionText: e.target.value })}
              />
            )}
            <ToggleRow
              label="Requerir un hashtag (#)"
              checked={filters.requireHashtag}
              onChange={(v) => patch({ requireHashtag: v })}
            />
            {filters.requireHashtag && (
              <input
                className="social-mini-input"
                placeholder="hashtag exacto (opcional, sin #)"
                value={filters.hashtagText}
                onChange={(e) => patch({ hashtagText: e.target.value })}
              />
            )}
            <label className="field">
              <span>Excluir comentarios con estas palabras (separadas por coma)</span>
              <input
                className="social-mini-input"
                placeholder="spam, bot, venta"
                value={excludeText}
                onChange={(e) => {
                  setExcludeText(e.target.value)
                  patch({ excludeWords: e.target.value.split(',') })
                }}
              />
            </label>
          </details>

          {/* 7. Sortear */}
          <button className="spin-btn" onClick={startDraw} disabled={eligible.length === 0}>
            🎉 Iniciar sorteo
          </button>
          {eligible.length === 0 && (
            <p className="social-hint">Ningún comentario cumple los filtros actuales.</p>
          )}
        </div>
      )}

      <SocialWinner
        winner={winner}
        isSubstitute={isSubstitute}
        accent={accent}
        canSubstitute={remaining.length > 0}
        onSubstitute={substitute}
        onClose={() => setWinner(null)}
      />
      <Confetti burst={confettiBurst} colors={colors} />
    </section>
  )
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="toggle">
      <span className="toggle-text">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        className={`switch ${checked ? 'on' : ''}`}
        onClick={() => onChange(!checked)}
      >
        <span className="knob" />
      </button>
    </label>
  )
}
