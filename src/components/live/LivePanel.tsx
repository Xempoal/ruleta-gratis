import { useCallback, useEffect, useRef, useState } from 'react'
import { Entry, uid } from '../../types'
import {
  AdminRaffle,
  LiveParticipant,
  createRaffle,
  getParticipants,
  patchRaffle,
  deleteRaffle,
  shareLink,
  loadAdminRaffle,
  saveAdminRaffle,
  clearAdminRaffle,
} from '../../lib/live'

const POLL_MS = 6000

function randomPin(): string {
  const buf = new Uint32Array(1)
  crypto.getRandomValues(buf)
  return String(buf[0] % 10000).padStart(4, '0')
}

// Panel del organizador: crear sorteo con link de registro y administrarlo.
export function LivePanel({
  setEntries,
  disabled,
}: {
  setEntries: (entries: Entry[]) => void
  disabled: boolean
}) {
  const [admin, setAdmin] = useState<AdminRaffle | null>(() => loadAdminRaffle())

  return (
    <section className="panel live-panel">
      <div className="panel-head">
        <h2>Sorteo con link</h2>
      </div>
      {admin ? (
        <AdminView
          admin={admin}
          setAdmin={setAdmin}
          setEntries={setEntries}
          disabled={disabled}
        />
      ) : (
        <CreateView onCreated={setAdmin} />
      )}
    </section>
  )
}

/* ── Crear sorteo ──────────────────────────────────────────────────────── */

function CreateView({ onCreated }: { onCreated: (a: AdminRaffle) => void }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [pin, setPin] = useState(randomPin)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) {
    return (
      <>
        <p className="live-hint">
          Comparte un link para que la gente se registre con su nombre y luego gira la ruleta
          con todos los participantes.
        </p>
        <button className="btn btn-primary live-create-btn" onClick={() => setOpen(true)}>
          Crear sorteo con link
        </button>
      </>
    )
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (busy) return
    setError(null)
    setBusy(true)
    try {
      const res = await createRaffle({
        title,
        slug: slug.trim() || undefined,
        pin: isPrivate ? pin : undefined,
      })
      const created: AdminRaffle = {
        slug: res.slug,
        title: res.title,
        token: res.adminToken,
        pin: res.pin,
        expiresAt: res.expiresAt,
      }
      saveAdminRaffle(created)
      onCreated(created)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="live-form">
      <label className="field">
        <span>Título del sorteo</span>
        <input
          type="text"
          maxLength={60}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ej. Sorteo de aniversario"
          required
        />
      </label>
      <label className="field">
        <span>Link personalizado (opcional)</span>
        <div className="slug-row">
          <span className="slug-prefix">/#/s/</span>
          <input
            type="text"
            maxLength={40}
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
            placeholder="mi-sorteo"
          />
        </div>
        <small className="hint">Si lo dejas vacío se genera uno aleatorio. Podrás editarlo.</small>
      </label>
      <label className="toggle">
        <span className="toggle-text">
          Sorteo privado con clave
          <small>Solo se registra quien tenga la clave de 4 dígitos.</small>
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={isPrivate}
          className={`switch ${isPrivate ? 'on' : ''}`}
          onClick={() => setIsPrivate((v) => !v)}
        >
          <span className="knob" />
        </button>
      </label>
      {isPrivate && (
        <label className="field">
          <span>Clave (4 dígitos)</span>
          <input
            type="text"
            inputMode="numeric"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            required
          />
        </label>
      )}
      {error && <p className="join-error">{error}</p>}
      <div className="live-form-actions">
        <button className="btn btn-primary" disabled={busy || !title.trim()}>
          {busy ? 'Creando…' : 'Crear sorteo'}
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>
          Cancelar
        </button>
      </div>
      <small className="hint">Los datos del sorteo se borran solos a las 24 horas.</small>
    </form>
  )
}

/* ── Administrar sorteo activo ─────────────────────────────────────────── */

function AdminView({
  admin,
  setAdmin,
  setEntries,
  disabled,
}: {
  admin: AdminRaffle
  setAdmin: (a: AdminRaffle | null) => void
  setEntries: (entries: Entry[]) => void
  disabled: boolean
}) {
  const [participants, setParticipants] = useState<LiveParticipant[]>([])
  const [status, setStatus] = useState<'open' | 'closed'>('open')
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [editingSlug, setEditingSlug] = useState(false)
  const [slugDraft, setSlugDraft] = useState(admin.slug)
  const [busy, setBusy] = useState(false)
  const adminRef = useRef(admin)
  adminRef.current = admin

  const refresh = useCallback(async () => {
    try {
      const cur = adminRef.current
      const res = await getParticipants(cur.slug, cur.token)
      setParticipants(res.participants)
      setStatus(res.status)
      setError(null)
    } catch (e) {
      const msg = (e as Error).message
      // El sorteo caducó (24 h) o fue borrado desde otro dispositivo
      if (msg.includes('no existe')) {
        clearAdminRaffle()
        setAdmin(null)
      } else {
        setError(msg)
      }
    }
  }, [setAdmin])

  useEffect(() => {
    refresh()
    const iv = setInterval(refresh, POLL_MS)
    return () => clearInterval(iv)
  }, [refresh])

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink(admin.slug))
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      setError('No se pudo copiar. Copia el link manualmente.')
    }
  }

  const toggleStatus = async () => {
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      const next = status === 'open' ? 'closed' : 'open'
      const res = await patchRaffle(admin.slug, admin.token, { status: next })
      setStatus(res.status)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const saveSlug = async () => {
    if (busy || slugDraft === admin.slug) {
      setEditingSlug(false)
      return
    }
    setBusy(true)
    setError(null)
    try {
      const res = await patchRaffle(admin.slug, admin.token, { newSlug: slugDraft })
      const updated = { ...admin, slug: res.slug }
      saveAdminRaffle(updated)
      setAdmin(updated)
      setEditingSlug(false)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const loadIntoWheel = () => {
    setEntries(participants.map((p) => ({ id: uid(), label: p.name })))
  }

  const conclude = async () => {
    if (busy) return
    if (!window.confirm('¿Concluir el sorteo? Se borrarán el link y todos los registros.')) return
    setBusy(true)
    try {
      await deleteRaffle(admin.slug, admin.token)
    } catch {
      /* si falla igual lo soltamos localmente; caduca solo a las 24 h */
    }
    clearAdminRaffle()
    setAdmin(null)
    setBusy(false)
  }

  return (
    <div className="live-admin">
      <p className="live-title-line">
        <strong>{admin.title}</strong>
        <span className={`live-status ${status}`}>
          {status === 'open' ? 'Registro abierto' : 'Registro cerrado'}
        </span>
      </p>

      <div className="live-link-row">
        {editingSlug ? (
          <>
            <span className="slug-prefix">/#/s/</span>
            <input
              type="text"
              maxLength={40}
              value={slugDraft}
              onChange={(e) =>
                setSlugDraft(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
              }
            />
            <button className="text-btn" onClick={saveSlug} disabled={busy}>
              Guardar
            </button>
          </>
        ) : (
          <>
            <code className="live-link">{shareLink(admin.slug)}</code>
            <button className="text-btn" onClick={copyLink}>
              {copied ? '¡Copiado!' : 'Copiar'}
            </button>
            <button className="text-btn" onClick={() => setEditingSlug(true)}>
              Editar
            </button>
          </>
        )}
      </div>

      {admin.pin && (
        <p className="live-pin">
          Clave del sorteo: <strong>{admin.pin}</strong> — compártela solo con tus invitados.
        </p>
      )}

      <p className="live-count">
        Registrados: <strong>{participants.length}</strong> / 500
      </p>

      {participants.length > 0 && (
        <ul className="live-list">
          {participants.map((p) => (
            <li key={p.id}>{p.name}</li>
          ))}
        </ul>
      )}

      {error && <p className="join-error">{error}</p>}

      <div className="live-actions">
        <button
          className="btn btn-primary"
          onClick={loadIntoWheel}
          disabled={disabled || participants.length === 0}
          title="Carga los registrados como participantes de la ruleta"
        >
          Pasar a la ruleta ({participants.length})
        </button>
        <button className="btn btn-ghost" onClick={toggleStatus} disabled={busy}>
          {status === 'open' ? 'Cerrar registro' : 'Reabrir registro'}
        </button>
        <button className="btn btn-ghost live-danger" onClick={conclude} disabled={busy}>
          Concluir y borrar
        </button>
      </div>
      <small className="hint">
        El sorteo y sus datos se borran solos a las 24 horas, o al concluirlo.
      </small>
    </div>
  )
}
