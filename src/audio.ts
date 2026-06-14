/* Sonido generado con Web Audio API — cero archivos, cero peso. */

let ctx: AudioContext | null = null
let muted = false

export function setMuted(m: boolean) {
  muted = m
}

function ac(): AudioContext | null {
  try {
    if (!ctx) ctx = new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

/** Clic mecánico del trinquete al pasar cada segmento */
export function tick() {
  if (muted) return
  const a = ac()
  if (!a) return
  const t = a.currentTime
  const osc = a.createOscillator()
  const gain = a.createGain()
  osc.type = 'square'
  osc.frequency.setValueAtTime(1500 + Math.random() * 300, t)
  osc.frequency.exponentialRampToValueAtTime(420, t + 0.045)
  gain.gain.setValueAtTime(0.09, t)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.05)
  osc.connect(gain).connect(a.destination)
  osc.start(t)
  osc.stop(t + 0.06)
}

/** Bip de cuenta regresiva; el último es más agudo */
export function beep(final = false) {
  if (muted) return
  const a = ac()
  if (!a) return
  const t = a.currentTime
  const osc = a.createOscillator()
  const gain = a.createGain()
  osc.type = 'sine'
  osc.frequency.value = final ? 1318 : 659
  gain.gain.setValueAtTime(0.18, t)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + (final ? 0.5 : 0.18))
  osc.connect(gain).connect(a.destination)
  osc.start(t)
  osc.stop(t + (final ? 0.5 : 0.2))
}

/** Fanfarria de victoria: arpegio ascendente con brillo */
export function fanfare(big = false) {
  if (muted) return
  const a = ac()
  if (!a) return
  const t = a.currentTime
  const notes = big
    ? [523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98]
    : [523.25, 659.25, 783.99, 1046.5]
  notes.forEach((f, i) => {
    const osc = a.createOscillator()
    const gain = a.createGain()
    osc.type = 'triangle'
    osc.frequency.value = f
    const start = t + i * 0.11
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(0.22, start + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.55)
    osc.connect(gain).connect(a.destination)
    osc.start(start)
    osc.stop(start + 0.6)
  })
  // Acorde final sostenido
  const chord = big ? [523.25, 659.25, 783.99, 1046.5] : [523.25, 659.25, 783.99]
  chord.forEach((f) => {
    const osc = a.createOscillator()
    const gain = a.createGain()
    osc.type = 'sawtooth'
    osc.frequency.value = f
    const start = t + notes.length * 0.11
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(0.06, start + 0.05)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 1.4)
    osc.connect(gain).connect(a.destination)
    osc.start(start)
    osc.stop(start + 1.5)
  })
}
