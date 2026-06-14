import { useState } from 'react'
import { SPONSOR } from '../config/sponsor'

// Banner superior "Patrocinado por …" que lleva al Instagram del patrocinador.
// Solo se renderiza si la función está activa (ver App.tsx / config/features.ts).
// El botón × lo oculta durante la sesión (no se guarda nada, coherente con la
// privacidad de la app).
export function SponsorBanner() {
  const [hidden, setHidden] = useState(false)
  if (hidden) return null

  return (
    <div className="sponsor-banner" role="complementary" aria-label="Patrocinador">
      <a
        className="sponsor-link"
        href={SPONSOR.instagramUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        {SPONSOR.logo && <img className="sponsor-logo" src={SPONSOR.logo} alt="" />}
        <span className="sponsor-text">
          {SPONSOR.prefix} <strong>{SPONSOR.brand}</strong>
        </span>
        <span className="sponsor-cta">{SPONSOR.cta} →</span>
      </a>
      <button
        className="sponsor-close"
        onClick={() => setHidden(true)}
        aria-label="Ocultar patrocinador"
        title="Ocultar"
      >
        ×
      </button>
    </div>
  )
}
