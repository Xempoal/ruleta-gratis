import { useMemo } from 'react'
import { TemplateId } from '../templates'

// Decoración de fondo del escenario según la plantilla:
//  B → nubes y arbustos estilo plastilina
//  D → confeti de colores
//  E → puntitos y burbuja azul suave
//  F → destellos y chispas candy
//  G → ramitas y manchas de papel kraft
// Es puramente decorativo (aria-hidden) y se posiciona absoluto detrás del contenido.
export function Decorations({ template }: { template: TemplateId }) {
  switch (template) {
    case 'D':
      return <DecoD />
    case 'E':
      return <DecoE />
    case 'F':
      return <DecoF />
    case 'G':
      return <DecoG />
    default:
      return <DecoB />
  }
}

function DecoE() {
  return (
    <div className="deco deco-e" aria-hidden="true">
      <span className="deco-dots-e" />
      <span className="deco-blob-e" />
    </div>
  )
}

function DecoF() {
  return (
    <div className="deco deco-f" aria-hidden="true">
      <span className="spark spark-1" />
      <span className="spark spark-2" />
      <span className="spark spark-3" />
      <span className="spark spark-4" />
      <span className="deco-blob-f-tl" />
      <span className="deco-blob-f-br" />
    </div>
  )
}

function DecoG() {
  return (
    <div className="deco deco-g" aria-hidden="true">
      <span className="sprig sprig-l" />
      <span className="sprig sprig-r" />
      <span className="paper-stain paper-stain-tr" />
      <span className="paper-stain paper-stain-bl" />
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
