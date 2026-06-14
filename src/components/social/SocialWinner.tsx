import { useEffect, useState } from 'react'
import { SocialComment } from '../../lib/comments'
import { Avatar } from './Avatar'

// Modal de revelación del ganador del sorteo por comentarios: foto + @usuario +
// su comentario. Permite sacar un suplente o cerrar.
export function SocialWinner({
  winner,
  isSubstitute,
  accent,
  canSubstitute,
  onSubstitute,
  onClose,
}: {
  winner: SocialComment | null
  isSubstitute: boolean
  accent: string
  canSubstitute: boolean
  onSubstitute: () => void
  onClose: () => void
}) {
  const [show, setShow] = useState(false)
  useEffect(() => {
    if (winner) {
      const t = setTimeout(() => setShow(true), 20)
      return () => clearTimeout(t)
    }
    setShow(false)
  }, [winner])

  if (!winner) return null

  return (
    <div
      className={`modal-overlay ${show ? 'in' : ''}`}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`winner-card social-winner ${show ? 'in' : ''}`}
        style={{ ['--accent' as string]: accent }}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="winner-kicker">
          <span className="kicker-line" />
          {isSubstitute ? 'Suplente' : 'Ganador'}
          <span className="kicker-line" />
        </p>
        <div className="social-winner-avatar">
          <Avatar username={winner.username} url={winner.profilePicUrl} size={96} />
        </div>
        <h2 className="winner-name">@{winner.username}</h2>
        <p className="social-winner-comment">“{winner.text}”</p>
        <div className="winner-actions">
          {canSubstitute && (
            <button className="btn btn-ghost" onClick={onSubstitute}>
              Sacar suplente
            </button>
          )}
          <button className="btn btn-primary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
