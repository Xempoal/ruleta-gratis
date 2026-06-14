import { useEffect, useRef } from 'react'

interface ConfettiProps {
  /** Cambia este número para disparar una nueva ráfaga */
  burst: number
  colors: string[]
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  rot: number
  vr: number
  size: number
  color: string
  shape: number
  life: number
}

export function Confetti({ burst, colors }: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const rafRef = useRef<number>(0)

  useEffect(() => {
    if (burst === 0) return
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    canvas.width = window.innerWidth * dpr
    canvas.height = window.innerHeight * dpr
    const ctx = canvas.getContext('2d')!
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const W = window.innerWidth
    const count = 150
    const newParts: Particle[] = []
    for (let i = 0; i < count; i++) {
      const fromLeft = i < count / 2
      newParts.push({
        x: fromLeft ? 0 : W,
        y: window.innerHeight * (0.55 + Math.random() * 0.2),
        vx: (fromLeft ? 1 : -1) * (6 + Math.random() * 9),
        vy: -(11 + Math.random() * 9),
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.4,
        size: 6 + Math.random() * 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        shape: Math.floor(Math.random() * 3),
        life: 1,
      })
    }
    // Una segunda lluvia desde arriba
    for (let i = 0; i < count * 0.6; i++) {
      newParts.push({
        x: Math.random() * W,
        y: -20,
        vx: (Math.random() - 0.5) * 4,
        vy: 2 + Math.random() * 4,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.4,
        size: 6 + Math.random() * 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        shape: Math.floor(Math.random() * 3),
        life: 1,
      })
    }
    particlesRef.current = newParts

    const gravity = 0.32
    const drag = 0.992

    const loop = () => {
      ctx.clearRect(0, 0, W, window.innerHeight)
      const parts = particlesRef.current
      let alive = false
      for (const p of parts) {
        p.vx *= drag
        p.vy = p.vy * drag + gravity
        p.x += p.vx
        p.y += p.vy
        p.rot += p.vr
        if (p.y > window.innerHeight + 40) p.life = 0
        if (p.life > 0) {
          alive = true
          ctx.save()
          ctx.translate(p.x, p.y)
          ctx.rotate(p.rot)
          ctx.fillStyle = p.color
          ctx.globalAlpha = Math.min(1, p.life)
          if (p.shape === 0) {
            ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.66)
          } else if (p.shape === 1) {
            ctx.beginPath()
            ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
            ctx.fill()
          } else {
            ctx.beginPath()
            ctx.moveTo(0, -p.size / 2)
            ctx.lineTo(p.size / 2, p.size / 2)
            ctx.lineTo(-p.size / 2, p.size / 2)
            ctx.closePath()
            ctx.fill()
          }
          ctx.restore()
        }
      }
      if (alive) {
        rafRef.current = requestAnimationFrame(loop)
      } else {
        ctx.clearRect(0, 0, W, window.innerHeight)
      }
    }
    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(loop)

    return () => cancelAnimationFrame(rafRef.current)
  }, [burst, colors])

  return <canvas ref={canvasRef} className="confetti-canvas" aria-hidden="true" />
}
