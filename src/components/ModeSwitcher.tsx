// Conmutador Ruleta / Comentarios. Solo se muestra cuando el módulo social
// está activo (ver App.tsx). Mientras esté oculto, la app solo tiene la ruleta.
export type AppMode = 'wheel' | 'social'

export function ModeSwitcher({
  mode,
  onChange,
}: {
  mode: AppMode
  onChange: (m: AppMode) => void
}) {
  return (
    <div className="mode-switcher seg-control" role="tablist">
      <button
        role="tab"
        aria-selected={mode === 'wheel'}
        className={mode === 'wheel' ? 'active' : ''}
        onClick={() => onChange('wheel')}
      >
        Ruleta
      </button>
      <button
        role="tab"
        aria-selected={mode === 'social'}
        className={mode === 'social' ? 'active' : ''}
        onClick={() => onChange('social')}
      >
        Comentarios
      </button>
    </div>
  )
}
