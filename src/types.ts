export interface Entry {
  id: string
  /** Texto del segmento (nombre, premio o lo que sea) */
  label: string
  /** Color personalizado del segmento; si no, usa la paleta del tema */
  color?: string
}

export interface Winner {
  entry: Entry
  /** 1 = primero en salir de la ruleta */
  drawOrder: number
}

export type SpinSpeed = 'rapido' | 'normal' | 'dramatico'

export interface Settings {
  title: string
  /** Plantilla (skin completo) elegida: B | D */
  templateId: string
  /** Paleta de colores de los segmentos */
  paletteId: string
  /** Colores personalizados que sobreescriben los de la paleta; null = usar paleta */
  customColors: string[] | null
  numWinners: number
  /** Si true, el participante que sale se quita de la ruleta */
  removeWinners: boolean
  spinSpeed: SpinSpeed
  soundOn: boolean
  countdown: boolean
  /** dataURL del logo subido — vive solo en memoria */
  logo: string | null
}

export const MAX_ENTRIES = 100
export const MAX_WINNERS = 10

export function uid(): string {
  return Math.random().toString(36).slice(2, 10)
}
