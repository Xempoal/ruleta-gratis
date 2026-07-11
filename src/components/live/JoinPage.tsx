import { useEffect, useRef, useState } from 'react'
import { LiveInfo, getRaffleInfo, joinRaffle } from '../../lib/live'

// Página pública de registro: la ve quien abre el link del sorteo (#/s/slug).
export function JoinPage({ slug }: { slug: string }) {
  const [info, setInfo] = useState<LiveInfo | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [pin, setPin] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [doneName, setDoneName] = useState<string | null>(null)
  const [count, setCount] = useState(0)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    getRaffleInfo(slug)
      .then((i) => {
        if (!mounted.current) return
        setInfo(i)
        setCount(i.count)
      })
      .catch((e: Error) => mounted.current && setLoadError(e.message))
    return () => {
      mounted.current = false
    }
  }, [slug])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (sending) return
    setError(null)
    setSending(true)
    try {
      const res = await joinRaffle(slug, name, info?.isPrivate ? pin : undefined)
      setDoneName(res.name)
      setCount(res.count)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="join-page">
      <div className="join-card panel">
        <p className="join-kicker">Sorteo</p>

        {loadError ? (
          <>
            <h1 className="join-title">Ups…</h1>
            <p className="join-sub">{loadError}</p>
          </>
        ) : !info ? (
          <p className="join-sub">Cargando sorteo…</p>
        ) : doneName ? (
          <>
            <h1 className="join-title">¡Listo, {doneName}! 🎉</h1>
            <p className="join-sub">
              Ya estás participando en <strong>{info.title}</strong>.
              <br />
              Participantes hasta ahora: <strong>{count}</strong>
            </p>
            <p className="join-hint">El organizador hará el sorteo con la ruleta. ¡Suerte!</p>
          </>
        ) : info.status !== 'open' ? (
          <>
            <h1 className="join-title">{info.title}</h1>
            <p className="join-sub">El registro de este sorteo ya está cerrado.</p>
          </>
        ) : count >= info.max ? (
          <>
            <h1 className="join-title">{info.title}</h1>
            <p className="join-sub">Este sorteo ya está lleno ({info.max} participantes).</p>
          </>
        ) : (
          <>
            <h1 className="join-title">{info.title}</h1>
            <p className="join-sub">
              Escribe tu nombre para participar · {count}/{info.max} registrados
            </p>
            <form onSubmit={submit} className="join-form">
              <input
                type="text"
                maxLength={40}
                placeholder="Tu nombre"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                required
              />
              {info.isPrivate && (
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="\d{4}"
                  maxLength={4}
                  placeholder="Clave de 4 dígitos"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  required
                />
              )}
              {error && <p className="join-error">{error}</p>}
              <button className="btn btn-primary join-btn" disabled={sending || !name.trim()}>
                {sending ? 'Registrando…' : '¡Participar!'}
              </button>
            </form>
          </>
        )}
      </div>
      <a className="join-footer" href="/">
        Crea tu propio sorteo gratis en <strong>ruletagratis.online</strong>
      </a>
    </div>
  )
}
