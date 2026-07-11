// Plantillas (skins completos) que el cliente elige: B (Divertido 3D) y D (Fiesta).
// Cada plantilla define el "skin" de la rueda (estilo de aro, puntero y centro
// + sus colores) y su acento de interfaz. El resto del chrome de la página
// (fondo, botón, decoración, tipografía del título) se aplica por CSS con el
// atributo data-template en .app — ver styles.css y Decorations.tsx.
// Los colores de los SEGMENTOS los aporta la paleta (palettes.ts), no la plantilla.

export type TemplateId = 'B' | 'D'

export type RingStyle = 'pearls' | 'pearlsBold' | 'ticks' | 'wood'
export type PointerStyle = 'pin' | 'drop' | 'triangle' | 'arrow'
export type HubStyle = 'arrow' | 'spiral' | 'refresh' | 'star'

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
]

export function getTemplate(id: string): Template {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0]
}
