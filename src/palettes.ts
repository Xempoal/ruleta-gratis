// Paletas de color de la ruleta. La paleta SOLO define los colores de los
// segmentos. El acento de la interfaz (botón, etc.) lo define la plantilla.
// El usuario puede elegir una paleta preset o personalizar los colores
// (settings.customColors); ver SettingsPanel.

export interface Palette {
  id: string
  name: string
  /** Colores de segmentos; se repiten en ciclo si hay más participantes */
  colors: string[]
}

export const PALETTES: Palette[] = [
  {
    id: 'pastel',
    name: 'Pastel',
    colors: ['#efb4c0', '#f3c8a0', '#b6e0c0', '#cabce6', '#f3e1a0', '#a8cdf0', '#f1c0d8', '#c6e2d1'],
  },
  {
    id: 'fiesta',
    name: 'Fiesta',
    colors: ['#f4cf4a', '#7cc36a', '#b79de0', '#ef94b8', '#f3a96a', '#5bc4bd', '#8a7be0', '#ef7d6a'],
  },
  {
    id: 'vivo',
    name: 'Vivo',
    colors: ['#7c5cdb', '#d6519b', '#e08a2e', '#d9b53f', '#3fae5a', '#2aa9a0', '#3f7fd6', '#cf4747'],
  },
  {
    id: 'sereno',
    name: 'Sereno',
    colors: ['#e7e3d8', '#d3d8df', '#b3bdc8', '#7e8a98', '#3f4a58', '#a3b3a4', '#c9d1c6', '#dccdbb'],
  },
  {
    id: 'arena',
    name: 'Arena',
    colors: ['#efe6d8', '#e3d2bd', '#d3b79a', '#c79a78', '#9c6f52', '#bda186', '#e8dcc8', '#d8c4a8'],
  },
  {
    id: 'bruma',
    name: 'Bruma',
    colors: ['#e9edf1', '#d3dbe3', '#b3c0cc', '#8b9bab', '#5f7081', '#3c4a59', '#a9b8c5', '#c6d1db'],
  },
  {
    id: 'jardin',
    name: 'Jardín',
    colors: ['#e7ebdd', '#d4ddc6', '#bccba8', '#9cb185', '#6f8a5c', '#4c6440', '#c0cfb0', '#dde4ce'],
  },
  {
    id: 'rosa',
    name: 'Rosa',
    colors: ['#f1e3e3', '#e7cdd2', '#d8aeb8', '#c08e9d', '#9c6878', '#7a4e5e', '#e9d3d8', '#dcbfc6'],
  },
  {
    id: 'nube',
    name: 'Nube',
    colors: ['#bcd8f7', '#d4c8f2', '#f7e6a8', '#f6c6d4', '#c3ecd2', '#f8d9b0', '#c9d7f2', '#e8d1ef'],
  },
  {
    id: 'candy',
    name: 'Candy',
    colors: ['#4dd6c4', '#b07ce8', '#f9a64a', '#f472b6', '#fb7185', '#f5c53e', '#8b8bf0', '#43c6ac'],
  },
  {
    id: 'kraft',
    name: 'Kraft',
    colors: ['#a9bb97', '#e2a78d', '#d8c59b', '#c8aa9e', '#b6c2a2', '#ddc19b', '#98ab88', '#d8a888'],
  },
  {
    id: 'noche',
    name: 'Noche',
    colors: ['#262b35', '#333a47', '#414a5a', '#2d333e', '#4a5366', '#383f4d', '#222730', '#444d5e'],
  },
]

export function getPalette(id: string): Palette {
  return PALETTES.find((p) => p.id === id) ?? PALETTES[0]
}

/** Texto legible (tinta o crema) sobre el fondo dado (#rrggbb) */
export function textColorFor(hex: string): string {
  const n = parseInt(hex.replace('#', ''), 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return lum > 145 ? '#36332d' : '#f3efe7'
}

/** Oscurece/aclara un color #rrggbb por un factor (-1 a 1) */
export function shade(hex: string, f: number): string {
  const n = parseInt(hex.replace('#', ''), 16)
  const ch = (v: number) =>
    Math.max(0, Math.min(255, Math.round(f < 0 ? v * (1 + f) : v + (255 - v) * f)))
  const r = ch((n >> 16) & 255)
  const g = ch((n >> 8) & 255)
  const b = ch(n & 255)
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')
}
