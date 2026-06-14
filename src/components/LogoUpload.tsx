import { useRef } from 'react'

interface LogoUploadProps {
  logo: string | null
  setLogo: (dataUrl: string | null) => void
}

export function LogoUpload({ logo, setLogo }: LogoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const onFile = (file?: File) => {
    if (!file) return
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => setLogo(String(reader.result))
    reader.readAsDataURL(file) // queda solo en memoria
  }

  return (
    <section className="panel logo-panel">
      <div className="panel-head">
        <h2>Tu logo</h2>
        {logo && (
          <button className="link-btn" onClick={() => setLogo(null)}>
            Quitar
          </button>
        )}
      </div>

      <div className="logo-row">
        {logo && <img src={logo} alt="Logo subido" className="logo-thumb" />}
        <button className="btn btn-ghost logo-upload-btn" onClick={() => inputRef.current?.click()}>
          {logo ? 'Cambiar logo' : 'Subir logo'}
        </button>
      </div>
      <small className="logo-note">Se muestra al centro de la ruleta · solo en memoria, no se guarda.</small>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => onFile(e.target.files?.[0])}
      />
    </section>
  )
}
