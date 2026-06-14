import { useEffect, useState } from 'react'
import { Entry } from '../types'

interface WinnerModalProps {
  winner: Entry | null
  /** posición real (1 = ganador principal) tras invertir el orden de salida */
  rank: number
  totalWinners: number
  /** Color de acento de la plantilla activa */
  accent: string
  onClose: () => void
  onContinue: () => void
  onSpinAgain: () => void
  hasMore: boolean
}

const ORDINALS = ['', '1.er', '2.º', '3.er', '4.º', '5.º', '6.º', '7.º', '8.º', '9.º', '10.º']

export function WinnerModal({
  winner,
  rank,
  totalWinners,
  accent,
  onClose,
  onContinue,
  onSpinAgain,
  hasMore,
}: WinnerModalProps) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (winner) {
      const t = setTimeout(() => setShow(true), 20)
      return () => clearTimeout(t)
    }
    setShow(false)
  }, [winner])

  if (!winner) return null

  const isMain = rank === 1
  const single = totalWinners === 1
  const label = single
    ? 'Ganador'
    : isMain
      ? 'Ganador principal'
      : `${ORDINALS[rank]} lugar · suplente`

  return (
    <div
      className={`modal-overlay ${show ? 'in' : ''}`}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`winner-card ${show ? 'in' : ''}`}
        style={{ ['--accent' as string]: accent }}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="winner-kicker">
          <span className="kicker-line" />
          {label}
          <span className="kicker-line" />
        </p>
        <h2 className="winner-name">{winner.label}</h2>
        <div className="winner-actions">
          {single ? (
            <>
              <button className="btn btn-primary" onClick={onSpinAgain}>
                ↻ Girar de nuevo
              </button>
              <button className="btn btn-ghost" onClick={onClose}>
                Cerrar
              </button>
            </>
          ) : hasMore ? (
            <button className="btn btn-primary" onClick={onContinue}>
              Siguiente giro
            </button>
          ) : (
            <button className="btn btn-primary" onClick={onClose}>
              Ver resultados
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
