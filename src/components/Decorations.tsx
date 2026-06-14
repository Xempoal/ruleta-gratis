import { useMemo } from 'react'
import { TemplateId } from '../templates'

// Decoración de fondo del escenario según la plantilla:
//  A → esquina suave azul + puntitos
//  B → nubes y arbustos estilo plastilina
//  C → esquina negra con trama de puntos
//  D → confeti de colores
// Es puramente decorativo (aria-hidden) y se posiciona absoluto detrás del contenido.
export function Decorations({ template }: { template: TemplateId }) {
  switch (template) {
    case 'B':
      return <DecoB />
    case 'C':
      return <DecoC />
    case 'D':
      return <DecoD />
    default:
      return <DecoA />
  }
}

function DecoA() {
  return (
    <div className="deco deco-a" aria-hidden="true">
      <span className="deco-dots deco-dots-tl" />
      <span className="deco-blob deco-blob-bl" />
    </div>
  )
}

function DecoB() {
  return (
    <div className="deco deco-b" aria-hidden="true">
      <span className="cloud cloud-1" />
      <span className="cloud cloud-2" />
      <span className="bush bush-l" />
      <span className="bush bush-r" />
    </div>
  )
}

function DecoC() {
  return (
    <div className="deco deco-c" aria-hidden="true">
      <span className="deco-wave" />
      <span className="deco-corner deco-corner-br" />
      <span className="deco-grid deco-grid-br" />
    </div>
  )
}

function DecoD() {
  // Confeti estático disperso (no animado) generado una vez.
  const bits = useMemo(() => {
    const colors = ['#f5c52b', '#ef94b8', '#7cc36a', '#5bc4bd', '#ffffff', '#b79de0']
    const arr: { left: number; top: number; rot: number; color: string; round: boolean }[] = []
    let seed = 7
    const rnd = () => {
      seed = (seed * 9301 + 49297) % 233280
      return seed / 233280
    }
    for (let i = 0; i < 36; i++) {
      arr.push({
        left: rnd() * 100,
        top: rnd() * 100,
        rot: rnd() * 360,
        color: colors[Math.floor(rnd() * colors.length)],
        round: rnd() > 0.5,
      })
    }
    return arr
  }, [])

  return (
    <div className="deco deco-d" aria-hidden="true">
      {bits.map((b, i) => (
        <span
          key={i}
          className={`confetti-bit ${b.round ? 'round' : ''}`}
          style={{
            left: `${b.left}%`,
            top: `${b.top}%`,
            background: b.color,
            transform: `rotate(${b.rot}deg)`,
          }}
        />
      ))}
      <span className="deco-blob deco-blob-br-pink" />
    </div>
  )
}
