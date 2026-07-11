import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
  useCallback,
} from 'react'
import { Entry, SpinSpeed } from '../types'
import { Template } from '../templates'
import { shade } from '../palettes'
import { tick as playTick } from '../audio'

export interface WheelHandle {
  spin: () => void
  isSpinning: () => boolean
}

interface WheelProps {
  pool: Entry[]
  template: Template
  /** Colores efectivos de los segmentos (customColors ?? palette.colors) */
  colors: string[]
  logo: string | null
  spinSpeed: SpinSpeed
  soundOn: boolean
  onRequestSpin?: () => void
  onSpinEnd: (winner: Entry) => void
}

const POINTER_ANGLE = -Math.PI / 2 // arriba (12 en punto)
const TWO_PI = Math.PI * 2

const SPEED_CONFIG: Record<SpinSpeed, { dur: number; spins: number }> = {
  rapido: { dur: 3400, spins: 5 },
  normal: { dur: 5400, spins: 7 },
  dramatico: { dur: 8400, spins: 9 },
}

// easeOutQuint — arranque firme y frenada larga y elegante
function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 5)
}

// Aleatorio uniforme en [0, 1) con crypto (mejor calidad que Math.random)
function rand(): number {
  const buf = new Uint32Array(1)
  crypto.getRandomValues(buf)
  return buf[0] / 4294967296
}

export const Wheel = forwardRef<WheelHandle, WheelProps>(function Wheel(
  { pool, template, colors, logo, spinSpeed, soundOn, onRequestSpin, onSpinEnd },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rotationRef = useRef(0)
  const spinningRef = useRef(false)
  const rafRef = useRef<number>(0)
  const lastTickSegRef = useRef(-1)
  const logoImgRef = useRef<HTMLImageElement | null>(null)
  const poolRef = useRef(pool)
  const templateRef = useRef(template)
  const colorsRef = useRef(colors)
  const speedRef = useRef(spinSpeed)
  const soundRef = useRef(soundOn)
  const onEndRef = useRef(onSpinEnd)

  poolRef.current = pool
  templateRef.current = template
  colorsRef.current = colors.length ? colors : ['#cccccc']
  speedRef.current = spinSpeed
  soundRef.current = soundOn
  onEndRef.current = onSpinEnd

  useEffect(() => {
    if (!logo) {
      logoImgRef.current = null
      draw()
      return
    }
    const img = new Image()
    img.onload = () => {
      logoImgRef.current = img
      draw()
    }
    img.src = logo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logo])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const size = canvas.clientWidth
    if (canvas.width !== Math.round(size * dpr)) {
      canvas.width = Math.round(size * dpr)
      canvas.height = Math.round(size * dpr)
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, size, size)

    const cx = size / 2
    const cy = size / 2
    const R = size / 2 - size * 0.06
    const tp = templateRef.current
    const cols = colorsRef.current
    const entries = poolRef.current
    const rotation = rotationRef.current

    // Sombra suave bajo la ruleta
    ctx.save()
    ctx.beginPath()
    ctx.arc(cx, cy, R, 0, TWO_PI)
    ctx.shadowColor = 'rgba(40,40,60,0.18)'
    ctx.shadowBlur = size * 0.05
    ctx.shadowOffsetY = size * 0.012
    ctx.fillStyle = tp.dark ? '#1b1f27' : '#ffffff'
    ctx.fill()
    ctx.restore()

    const n = entries.length

    if (n === 0) {
      ctx.beginPath()
      ctx.arc(cx, cy, R, 0, TWO_PI)
      ctx.fillStyle = cols[0]
      ctx.fill()
      ctx.fillStyle = tp.dark ? 'rgba(243,239,231,0.6)' : 'rgba(54,51,45,0.5)'
      ctx.font = `500 ${size * 0.038}px "Albert Sans", sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('Agrega participantes', cx, cy - R * 0.4)
      drawRing(ctx, cx, cy, R, tp, rotation, 0)
      drawHub(ctx, cx, cy, R, tp, logoImgRef.current, spinningRef.current)
      drawPointer(ctx, cx, cy, R, tp)
      return
    }

    const seg = TWO_PI / n

    for (let i = 0; i < n; i++) {
      const a0 = rotation + i * seg
      const a1 = a0 + seg
      const base = entries[i].color ?? cols[i % cols.length]

      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.arc(cx, cy, R, a0, a1)
      ctx.closePath()
      ctx.fillStyle = base
      ctx.fill()
      // Divisor fino
      ctx.strokeStyle = tp.divider
      ctx.lineWidth = Math.max(1, size * 0.0035)
      ctx.stroke()

      // Texto del segmento (una línea). Siempre en negro para legibilidad uniforme.
      const entry = entries[i]

      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(a0 + seg / 2)
      ctx.textAlign = 'right'
      ctx.fillStyle = '#1a1a1a'

      const mainSize = Math.max(
        9,
        Math.min(size * 0.052, seg * R * 0.46, size * 0.06),
      )
      const radius = R * 0.92

      let main = entry.label
      if (main.length > 22) main = main.slice(0, 21) + '…'

      ctx.font = `600 ${mainSize}px "Albert Sans", sans-serif`
      ctx.textBaseline = 'middle'
      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0
      ctx.fillText(main, radius, 0)
      ctx.restore()
    }

    drawRing(ctx, cx, cy, R, tp, rotation, n)
    drawHub(ctx, cx, cy, R, tp, logoImgRef.current, spinningRef.current)
    drawPointer(ctx, cx, cy, R, tp)
  }, [])

  useEffect(() => {
    draw()
  }, [pool, template, colors, draw])

  useEffect(() => {
    const ro = new ResizeObserver(() => draw())
    if (canvasRef.current) ro.observe(canvasRef.current)
    return () => ro.disconnect()
  }, [draw])

  const animate = useCallback(
    (from: number, to: number, dur: number) => {
      const start = performance.now()
      const n = poolRef.current.length
      const seg = n > 0 ? TWO_PI / n : TWO_PI

      const step = (now: number) => {
        const elapsed = now - start
        const t = Math.min(1, elapsed / dur)
        const eased = easeOut(t)
        rotationRef.current = from + (to - from) * eased
        draw()

        if (n > 0) {
          const underPointer =
            Math.floor(
              ((((POINTER_ANGLE - rotationRef.current) % TWO_PI) + TWO_PI) % TWO_PI) / seg,
            ) % n
          if (underPointer !== lastTickSegRef.current) {
            lastTickSegRef.current = underPointer
            if (soundRef.current) playTick()
          }
        }

        if (t < 1) {
          rafRef.current = requestAnimationFrame(step)
        } else {
          spinningRef.current = false
          rotationRef.current = ((to % TWO_PI) + TWO_PI) % TWO_PI
          draw()
          const idx =
            Math.floor(
              ((((POINTER_ANGLE - rotationRef.current) % TWO_PI) + TWO_PI) % TWO_PI) / seg,
            ) % n
          const winner = poolRef.current[idx]
          if (winner) onEndRef.current(winner)
        }
      }
      rafRef.current = requestAnimationFrame(step)
    },
    [draw],
  )

  const spin = useCallback(() => {
    if (spinningRef.current) return
    const n = poolRef.current.length
    if (n === 0) return
    spinningRef.current = true
    lastTickSegRef.current = -1

    const seg = TWO_PI / n
    const { dur, spins } = SPEED_CONFIG[speedRef.current]
    const winnerIdx = Math.floor(rand() * n)
    const jitter = (rand() - 0.5) * seg * 0.7
    const targetCenter = (winnerIdx + 0.5) * seg
    const current = rotationRef.current
    let final = POINTER_ANGLE - targetCenter + jitter
    final = current + spins * TWO_PI + ((((final - current) % TWO_PI) + TWO_PI) % TWO_PI)

    animate(current, final, dur)
  }, [animate])

  useImperativeHandle(ref, () => ({
    spin,
    isSpinning: () => spinningRef.current,
  }))

  useEffect(() => () => cancelAnimationFrame(rafRef.current), [])

  return (
    <canvas
      ref={canvasRef}
      className="wheel-canvas"
      aria-label="Ruleta de sorteo. Clic para girar."
      role="button"
      onClick={() => onRequestSpin?.()}
    />
  )
})

/* ---------- ARO (según template.ringStyle) ---------- */

function drawRing(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  R: number,
  tp: Template,
  rotation: number,
  n: number,
) {
  switch (tp.ringStyle) {
    case 'ticks':
      drawRingTicks(ctx, cx, cy, R, tp)
      break
    case 'wood':
      drawRingWood(ctx, cx, cy, R, tp)
      break
    case 'plain':
      drawRingPlain(ctx, cx, cy, R, tp)
      break
    case 'pearlsBold':
      drawRingPearls(ctx, cx, cy, R, tp, rotation, n, true)
      break
    default:
      drawRingPearls(ctx, cx, cy, R, tp, rotation, n, false)
  }
}

function drawRingPearls(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  R: number,
  tp: Template,
  rotation: number,
  n: number,
  bold: boolean,
) {
  const size = R * 2
  // Banda del aro
  ctx.beginPath()
  ctx.arc(cx, cy, R, 0, TWO_PI)
  ctx.strokeStyle = tp.ringColor
  ctx.lineWidth = bold ? Math.max(6, size * 0.05) : Math.max(2, size * 0.012)
  ctx.stroke()

  // Perlas: en los límites de segmento (fino) o muchas perlas grandes (bold)
  if (bold) {
    const count = 32
    for (let i = 0; i < count; i++) {
      const a = (i / count) * TWO_PI
      const dx = cx + Math.cos(a) * R
      const dy = cy + Math.sin(a) * R
      ctx.beginPath()
      ctx.arc(dx, dy, size * 0.017, 0, TWO_PI)
      ctx.fillStyle = '#ffffff'
      ctx.shadowColor = 'rgba(40,30,70,0.25)'
      ctx.shadowBlur = size * 0.01
      ctx.fill()
      ctx.shadowBlur = 0
    }
  } else if (n > 1) {
    const seg = TWO_PI / n
    for (let i = 0; i < n; i++) {
      const a = rotation + i * seg
      const dx = cx + Math.cos(a) * R
      const dy = cy + Math.sin(a) * R
      ctx.beginPath()
      ctx.arc(dx, dy, size * 0.007, 0, TWO_PI)
      ctx.fillStyle = tp.dark ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.95)'
      ctx.fill()
    }
  }
}

function drawRingPlain(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  R: number,
  tp: Template,
) {
  const size = R * 2
  // Banda gruesa lisa (borde blanco estilo moderno)
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, R, 0, TWO_PI)
  ctx.strokeStyle = tp.ringColor
  ctx.lineWidth = Math.max(6, size * 0.045)
  ctx.shadowColor = 'rgba(40,40,60,0.14)'
  ctx.shadowBlur = size * 0.02
  ctx.stroke()
  ctx.restore()
}

function drawRingTicks(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  R: number,
  tp: Template,
) {
  const size = R * 2
  // Aro fino
  ctx.beginPath()
  ctx.arc(cx, cy, R, 0, TWO_PI)
  ctx.strokeStyle = tp.ringColor
  ctx.lineWidth = Math.max(1.5, size * 0.006)
  ctx.stroke()

  // Marcas radiales tipo reloj, por fuera del borde
  const count = 48
  ctx.strokeStyle = tp.ringColor
  ctx.lineCap = 'round'
  for (let i = 0; i < count; i++) {
    const a = (i / count) * TWO_PI
    const long = i % 4 === 0
    const r0 = R + size * 0.012
    const r1 = R + size * (long ? 0.05 : 0.03)
    ctx.lineWidth = long ? Math.max(1.5, size * 0.006) : Math.max(1, size * 0.0035)
    ctx.beginPath()
    ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0)
    ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1)
    ctx.stroke()
  }
}

function drawRingWood(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  R: number,
  tp: Template,
) {
  const size = R * 2
  // Banda gruesa estilo madera/cuerda
  ctx.beginPath()
  ctx.arc(cx, cy, R, 0, TWO_PI)
  ctx.strokeStyle = tp.ringColor
  ctx.lineWidth = Math.max(7, size * 0.055)
  ctx.stroke()
  // Borde interior sutil más oscuro
  ctx.beginPath()
  ctx.arc(cx, cy, R - size * 0.026, 0, TWO_PI)
  ctx.strokeStyle = shade(tp.ringColor, -0.25)
  ctx.lineWidth = Math.max(1, size * 0.006)
  ctx.stroke()
  // Cuentas sobre la banda
  const count = 30
  for (let i = 0; i < count; i++) {
    const a = (i / count) * TWO_PI
    const dx = cx + Math.cos(a) * R
    const dy = cy + Math.sin(a) * R
    ctx.beginPath()
    ctx.arc(dx, dy, size * 0.012, 0, TWO_PI)
    ctx.fillStyle = i % 2 === 0 ? shade(tp.ringColor, 0.2) : shade(tp.ringColor, -0.18)
    ctx.fill()
  }
}

/* ---------- PUNTERO (según template.pointerStyle) ---------- */

function drawPointer(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  R: number,
  tp: Template,
) {
  switch (tp.pointerStyle) {
    case 'pin':
      drawPointerPin(ctx, cx, cy, R, tp)
      break
    case 'triangle':
      drawPointerTriangle(ctx, cx, cy, R, tp)
      break
    case 'arrow':
      drawPointerArrow(ctx, cx, cy, R, tp)
      break
    case 'peg':
      drawPointerPeg(ctx, cx, cy, R, tp)
      break
    default:
      drawPointerDrop(ctx, cx, cy, R, tp)
  }
}

function drawPointerDrop(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  R: number,
  tp: Template,
) {
  const pr = R * 0.072
  const bulbY = cy - R - pr * 0.25
  const tipY = cy - R + R * 0.085
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(cx, tipY)
  ctx.bezierCurveTo(cx - pr * 0.95, bulbY + pr * 0.7, cx - pr, bulbY - pr * 0.25, cx, bulbY - pr)
  ctx.bezierCurveTo(cx + pr, bulbY - pr * 0.25, cx + pr * 0.95, bulbY + pr * 0.7, cx, tipY)
  ctx.closePath()
  ctx.fillStyle = tp.pointerColor
  ctx.shadowColor = 'rgba(30,30,45,0.3)'
  ctx.shadowBlur = R * 0.03
  ctx.shadowOffsetY = R * 0.008
  ctx.fill()
  ctx.shadowBlur = 0
  // punto interior claro
  ctx.beginPath()
  ctx.arc(cx, bulbY - pr * 0.15, pr * 0.33, 0, TWO_PI)
  ctx.fillStyle = 'rgba(255,255,255,0.92)'
  ctx.fill()
  ctx.restore()
}

function drawPointerPin(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  R: number,
  tp: Template,
) {
  // Pin de mapa: círculo con punta hacia abajo apuntando al borde
  const pr = R * 0.056
  const tipY = cy - R + R * 0.06
  const headY = tipY - pr * 2.4
  ctx.save()
  ctx.beginPath()
  // lados que convergen en la punta
  ctx.moveTo(cx, tipY)
  ctx.bezierCurveTo(cx - pr * 0.9, headY + pr * 0.9, cx - pr, headY - pr * 0.2, cx, headY - pr)
  ctx.bezierCurveTo(cx + pr, headY - pr * 0.2, cx + pr * 0.9, headY + pr * 0.9, cx, tipY)
  ctx.closePath()
  ctx.fillStyle = tp.pointerColor
  ctx.shadowColor = 'rgba(30,30,45,0.3)'
  ctx.shadowBlur = R * 0.03
  ctx.shadowOffsetY = R * 0.008
  ctx.fill()
  ctx.shadowBlur = 0
  // agujero interior
  ctx.beginPath()
  ctx.arc(cx, headY, pr * 0.42, 0, TWO_PI)
  ctx.fillStyle = '#ffffff'
  ctx.fill()
  ctx.restore()
}

function drawPointerTriangle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  R: number,
  tp: Template,
) {
  const w = R * 0.07
  const topY = cy - R - R * 0.035
  const tipY = cy - R + R * 0.07
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(cx - w, topY)
  ctx.lineTo(cx + w, topY)
  ctx.lineTo(cx, tipY)
  ctx.closePath()
  ctx.fillStyle = tp.pointerColor
  ctx.shadowColor = 'rgba(30,30,45,0.25)'
  ctx.shadowBlur = R * 0.02
  ctx.shadowOffsetY = R * 0.006
  ctx.fill()
  ctx.restore()
}

function drawPointerArrow(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  R: number,
  tp: Template,
) {
  // Flecha gruesa apuntando hacia abajo (con cola)
  const w = R * 0.062
  const topY = cy - R - R * 0.05
  const tipY = cy - R + R * 0.075
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(cx, tipY)
  ctx.lineTo(cx - w * 1.5, topY + w)
  ctx.lineTo(cx - w * 0.6, topY + w)
  ctx.lineTo(cx - w * 0.6, topY)
  ctx.lineTo(cx + w * 0.6, topY)
  ctx.lineTo(cx + w * 0.6, topY + w)
  ctx.lineTo(cx + w * 1.5, topY + w)
  ctx.closePath()
  ctx.fillStyle = tp.pointerColor
  ctx.strokeStyle = shade(tp.pointerColor, -0.3)
  ctx.lineWidth = Math.max(1, R * 0.004)
  ctx.shadowColor = 'rgba(30,30,45,0.28)'
  ctx.shadowBlur = R * 0.025
  ctx.shadowOffsetY = R * 0.006
  ctx.fill()
  ctx.shadowBlur = 0
  ctx.stroke()
  ctx.restore()
}

function drawPointerPeg(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  R: number,
  tp: Template,
) {
  // Pinza/taquito de cartón: rectángulo redondeado que asoma sobre el aro
  const w = R * 0.052
  const topY = cy - R - R * 0.085
  const botY = cy - R + R * 0.055
  const r = w * 0.5
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(cx - w + r, topY)
  ctx.arcTo(cx + w, topY, cx + w, botY, r)
  ctx.arcTo(cx + w, botY, cx - w, botY, r)
  ctx.arcTo(cx - w, botY, cx - w, topY, r)
  ctx.arcTo(cx - w, topY, cx + w, topY, r)
  ctx.closePath()
  ctx.fillStyle = tp.pointerColor
  ctx.shadowColor = 'rgba(60,45,25,0.35)'
  ctx.shadowBlur = R * 0.02
  ctx.shadowOffsetY = R * 0.006
  ctx.fill()
  ctx.shadowBlur = 0
  ctx.strokeStyle = shade(tp.pointerColor, -0.25)
  ctx.lineWidth = Math.max(1, R * 0.004)
  ctx.stroke()
  // Ranura central
  ctx.beginPath()
  ctx.arc(cx, topY + (botY - topY) * 0.32, w * 0.28, 0, TWO_PI)
  ctx.fillStyle = shade(tp.pointerColor, -0.35)
  ctx.fill()
  ctx.restore()
}

/* ---------- CENTRO (según template.hubStyle) ---------- */

function drawHub(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  R: number,
  tp: Template,
  logo: HTMLImageElement | null,
  spinning: boolean,
) {
  const hubR = R * 0.2
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, hubR, 0, TWO_PI)
  ctx.fillStyle = tp.hubColor
  ctx.shadowColor = 'rgba(30,30,45,0.22)'
  ctx.shadowBlur = R * 0.05
  ctx.fill()
  ctx.shadowBlur = 0
  ctx.lineWidth = Math.max(1.5, R * 0.008)
  ctx.strokeStyle = tp.ringStyle === 'ticks' ? tp.hubColor : tp.ringColor
  ctx.stroke()
  ctx.restore()

  if (logo) {
    ctx.save()
    const r = hubR * 0.82
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, TWO_PI)
    ctx.clip()
    const scale = Math.max((2 * r) / logo.width, (2 * r) / logo.height)
    const w = logo.width * scale
    const h = logo.height * scale
    ctx.drawImage(logo, cx - w / 2, cy - h / 2, w, h)
    ctx.restore()
    return
  }

  ctx.save()
  ctx.globalAlpha = spinning ? 0.5 : 1
  switch (tp.hubStyle) {
    case 'spiral':
      drawHubSpiral(ctx, cx, cy, hubR, tp)
      break
    case 'refresh':
      drawHubRefresh(ctx, cx, cy, hubR, tp)
      break
    case 'star':
      drawHubStar(ctx, cx, cy, hubR, tp)
      break
    case 'gift':
      drawHubGift(ctx, cx, cy, hubR, tp)
      break
    case 'smile':
      drawHubSmile(ctx, cx, cy, hubR, tp)
      break
    default:
      drawHubArrow(ctx, cx, cy, hubR, R, tp)
  }
  ctx.restore()
}

function drawHubArrow(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  hubR: number,
  R: number,
  tp: Template,
) {
  ctx.strokeStyle = tp.hubIconColor
  ctx.fillStyle = tp.hubIconColor
  const arcR = hubR * 0.42
  ctx.lineWidth = Math.max(2, R * 0.013)
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.arc(cx, cy, arcR, Math.PI * 0.45, Math.PI * 2.05)
  ctx.stroke()
  const tipA = Math.PI * 2.05
  const tx = cx + Math.cos(tipA) * arcR
  const tyy = cy + Math.sin(tipA) * arcR
  const ah = hubR * 0.22
  ctx.beginPath()
  ctx.moveTo(tx, tyy)
  ctx.lineTo(tx - ah * 0.95, tyy - ah * 0.2)
  ctx.lineTo(tx - ah * 0.1, tyy - ah * 1.15)
  ctx.closePath()
  ctx.fill()
}

function drawHubRefresh(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  hubR: number,
  tp: Template,
) {
  ctx.strokeStyle = tp.hubIconColor
  ctx.fillStyle = tp.hubIconColor
  const arcR = hubR * 0.44
  ctx.lineWidth = Math.max(2, hubR * 0.12)
  ctx.lineCap = 'round'
  // arco casi completo
  ctx.beginPath()
  ctx.arc(cx, cy, arcR, Math.PI * 0.15, Math.PI * 1.75)
  ctx.stroke()
  // punta de flecha al final
  const tipA = Math.PI * 1.75
  const tx = cx + Math.cos(tipA) * arcR
  const ty = cy + Math.sin(tipA) * arcR
  const ah = hubR * 0.26
  ctx.beginPath()
  ctx.moveTo(tx, ty)
  ctx.lineTo(tx + ah * 0.2, ty - ah * 1.0)
  ctx.lineTo(tx + ah * 1.05, ty - ah * 0.15)
  ctx.closePath()
  ctx.fill()
}

function drawHubSpiral(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  hubR: number,
  tp: Template,
) {
  ctx.strokeStyle = tp.hubIconColor
  ctx.lineWidth = Math.max(2, hubR * 0.13)
  ctx.lineCap = 'round'
  ctx.beginPath()
  const turns = 2.6
  const maxR = hubR * 0.6
  const steps = 80
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const a = t * turns * TWO_PI
    const r = maxR * t
    const x = cx + Math.cos(a) * r
    const y = cy + Math.sin(a) * r
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.stroke()
}

function drawHubGift(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  hubR: number,
  tp: Template,
) {
  const s = hubR * 1.1 // ancho de la caja
  const lw = Math.max(2, hubR * 0.11)
  ctx.strokeStyle = tp.hubIconColor
  ctx.lineWidth = lw
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  const boxTop = cy - s * 0.18
  const boxBot = cy + s * 0.52
  const lidTop = boxTop - s * 0.2
  // Caja
  ctx.strokeRect(cx - s * 0.38, boxTop, s * 0.76, boxBot - boxTop)
  // Tapa
  ctx.strokeRect(cx - s * 0.46, lidTop, s * 0.92, s * 0.2)
  // Cinta vertical
  ctx.beginPath()
  ctx.moveTo(cx, lidTop)
  ctx.lineTo(cx, boxBot)
  ctx.stroke()
  // Moño (dos bucles)
  const bowR = s * 0.16
  ctx.beginPath()
  ctx.arc(cx - bowR, lidTop - bowR * 0.8, bowR, Math.PI * 0.25, Math.PI * 1.65)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(cx + bowR, lidTop - bowR * 0.8, bowR, Math.PI * 1.35, Math.PI * 0.75)
  ctx.stroke()
}

function drawHubSmile(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  hubR: number,
  tp: Template,
) {
  const lw = Math.max(2, hubR * 0.1)
  ctx.strokeStyle = tp.hubIconColor
  ctx.fillStyle = tp.hubIconColor
  ctx.lineWidth = lw
  ctx.lineCap = 'round'
  // Contorno de la carita
  ctx.beginPath()
  ctx.arc(cx, cy, hubR * 0.62, 0, TWO_PI)
  ctx.stroke()
  // Ojos
  const eyeR = hubR * 0.075
  ctx.beginPath()
  ctx.arc(cx - hubR * 0.24, cy - hubR * 0.14, eyeR, 0, TWO_PI)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(cx + hubR * 0.24, cy - hubR * 0.14, eyeR, 0, TWO_PI)
  ctx.fill()
  // Sonrisa
  ctx.beginPath()
  ctx.arc(cx, cy + hubR * 0.05, hubR * 0.32, Math.PI * 0.18, Math.PI * 0.82)
  ctx.stroke()
}

function drawHubStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  hubR: number,
  tp: Template,
) {
  const outer = hubR * 0.62
  const inner = outer * 0.42
  ctx.fillStyle = tp.hubIconColor
  ctx.beginPath()
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner
    const a = -Math.PI / 2 + (i / 10) * TWO_PI
    const x = cx + Math.cos(a) * r
    const y = cy + Math.sin(a) * r
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
  ctx.fill()
}
