import { Winner } from '../types'

interface PodiumProps {
  winners: Winner[]
  totalPlanned: number
  onReset: () => void
  onNewDraw: () => void
}

/** rank final = totalPlanned - drawOrder + 1 (el último en salir es el 1.º) */
function rankOf(w: Winner, total: number) {
  return total - w.drawOrder + 1
}

export function Podium({ winners, totalPlanned, onReset, onNewDraw }: PodiumProps) {
  if (winners.length === 0) return null
  const ranked = [...winners].sort((a, b) => rankOf(a, totalPlanned) - rankOf(b, totalPlanned))

  return (
    <div className="podium">
      <header className="podium-head">
        <h3>Resultados del sorteo</h3>
        <p>El último en salir es el ganador. Los demás quedan como suplentes en orden.</p>
      </header>
      <ol className="podium-list">
        {ranked.map((w) => {
          const r = rankOf(w, totalPlanned)
          return (
            <li key={w.entry.id + w.drawOrder} className={`podium-item rank-${r}`}>
              <span className="podium-rank">{r}</span>
              <span className="podium-text">
                <span className="podium-name">{w.entry.label}</span>
              </span>
              <span className="podium-tag">
                {r === 1 ? 'Ganador' : `Suplente ${r - 1}`}
              </span>
            </li>
          )
        })}
      </ol>
      <div className="podium-actions">
        <button className="btn btn-primary" onClick={onReset}>
          ↻ Girar de nuevo
        </button>
        <button className="btn btn-ghost" onClick={onNewDraw}>
          Vaciar lista
        </button>
      </div>
    </div>
  )
}
