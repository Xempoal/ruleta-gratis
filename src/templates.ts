// Plantillas (skins completos) que el cliente elige:
// B (Divertido 3D), D (Fiesta), E (Moderno), F (Candy), G (Papel).
// Cada plantilla define el "skin" de la rueda (estilo de aro, puntero y centro
// + sus colores) y su acento de interfaz. El resto del chrome de la página
// (fondo, botón, decoración, tipografía del título) se aplica por CSS con el
// atributo data-template en .app — ver styles.css y Decorations.tsx.
// Los colores de los SEGMENTOS los aporta la paleta (palettes.ts), no la plantilla.

export type TemplateId = 'B' | 'D' | 'E' | 'F' | 'G'

export type RingStyle = 'pearls' | 'pearlsBold' | 'ticks' | 'wood' | 'plain'
export type PointerStyle = 'pin' | 'drop' | 'triangle' | 'arrow' | 'peg'
export type HubStyle = 'arrow' | 'spiral' | 'refresh' | 'star' | 'gift' | 'smile'

export interface Template {
  id: TemplateId
  name: string
  /** Descripción corta para el selector */
  tagline: string
  /** Paleta por defecto al elegir esta plantilla */
  defaultPaletteId: string
  /** Acento de la interfaz (botón girar, tarjeta de ganador, confeti destacado) */
  accent: string
  /** Línea divisoria entre segmentos */
  divider: string

  ringStyle: RingStyle
  ringColor: string

  pointerStyle: PointerStyle
  pointerColor: string

  hubStyle: HubStyle
  /** Relleno del disco central */
  hubColor: string
  /** Color del ícono del centro (flecha/espiral/recargar/estrella) */
  hubIconColor: string

  /** La rueda/escenario es de tono oscuro (afecta sombras y texto por defecto) */
  dark?: boolean
}

export const TEMPLATES: Template[] = [
  {
    id: 'B',
    name: 'Divertido 3D',
    tagline: 'Estilo plastilina, cálido',
    defaultPaletteId: 'fiesta',
    accent: '#17b3a6',
    divider: '#ffffff',
    ringStyle: 'wood',
    ringColor: '#d8b98a',
    pointerStyle: 'drop',
    pointerColor: '#ef6c2e',
    hubStyle: 'spiral',
    hubColor: '#ef6c2e',
    hubIconColor: '#ffffff',
  },
  {
    id: 'D',
    name: 'Fiesta',
    tagline: 'Morado festivo con confeti',
    defaultPaletteId: 'fiesta',
    accent: '#f5c52b',
    divider: '#ffffff',
    ringStyle: 'pearlsBold',
    ringColor: '#7c5cdb',
    pointerStyle: 'arrow',
    pointerColor: '#f5c52b',
    hubStyle: 'star',
    hubColor: '#7c5cdb',
    hubIconColor: '#f5c52b',
  },
  {
    id: 'E',
    name: 'Moderno',
    tagline: 'Azul limpio y actual',
    defaultPaletteId: 'nube',
    accent: '#2563eb',
    divider: '#ffffff',
    ringStyle: 'plain',
    ringColor: '#ffffff',
    pointerStyle: 'pin',
    pointerColor: '#2f7bf5',
    hubStyle: 'gift',
    hubColor: '#ffffff',
    hubIconColor: '#2563eb',
  },
  {
    id: 'F',
    name: 'Candy',
    tagline: 'Degradado rosa vibrante',
    defaultPaletteId: 'candy',
    accent: '#ec4899',
    divider: '#ffffff',
    ringStyle: 'plain',
    ringColor: '#ffffff',
    pointerStyle: 'pin',
    pointerColor: '#c026d3',
    hubStyle: 'star',
    hubColor: '#ec4899',
    hubIconColor: '#ffffff',
  },
  {
    id: 'G',
    name: 'Papel',
    tagline: 'Artesanal estilo kraft',
    defaultPaletteId: 'kraft',
    accent: '#6f7f5a',
    divider: '#efe6d3',
    ringStyle: 'wood',
    ringColor: '#c9a06b',
    pointerStyle: 'peg',
    pointerColor: '#b98d5f',
    hubStyle: 'smile',
    hubColor: '#cfa970',
    hubIconColor: '#4a3a28',
  },
]

export function getTemplate(id: string): Template {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0]
}
