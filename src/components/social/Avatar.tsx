import { useState } from 'react'

// Foto de perfil con respaldo: si la imagen no carga (o no hay), muestra la
// inicial sobre un color derivado del nombre. Evita depender de la red.
function colorFor(name: string): string {
  let h = 0
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 360
  return `hsl(${h} 55% 62%)`
}

export function Avatar({
  username,
  url,
  size = 40,
}: {
  username: string
  url?: string
  size?: number
}) {
  const [broken, setBroken] = useState(false)
  const initial = (username[0] || '?').toUpperCase()

  if (url && !broken) {
    return (
      <img
        className="avatar"
        src={url}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        onError={() => setBroken(true)}
        style={{ width: size, height: size }}
      />
    )
  }
  return (
    <span
      className="avatar avatar-fallback"
      style={{ width: size, height: size, background: colorFor(username), fontSize: size * 0.42 }}
      aria-hidden="true"
    >
      {initial}
    </span>
  )
}
