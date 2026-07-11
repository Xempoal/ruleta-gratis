import { useState } from 'react'
import { Settings, MAX_WINNERS } from '../types'
import { TEMPLATES, getTemplate } from '../templates'
import { PALETTES, getPalette } from '../palettes'

interface SettingsPanelProps {
  settings: Settings
  patch: (p: Partial<Settings>) => void
  disabled: boolean
}

export function SettingsPanel({ settings, patch, disabled }: SettingsPanelProps) {
  const [editColors, setEditColors] = useState(false)

  const palette = getPalette(settings.paletteId)
  const effectiveColors =
    settings.customColors && settings.customColors.length ? settings.customColors : palette.colors

  // Al elegir plantilla: ajusta su paleta por defecto y limpia colores personalizados.
  const chooseTemplate = (id: string) => {
    const t = getTemplate(id)
    patch({ templateId: id, paletteId: t.defaultPaletteId, customColors: null })
  }

  const choosePalette = (id: string) => {
    patch({ paletteId: id, customColors: null })
  }

  const setColorAt = (i: number, color: string) => {
    const next = [...effectiveColors]
    next[i] = color
    patch({ customColors: next })
  }

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Diseño y reglas</h2>
      </div>

      <label className="field">
        <span>Título del sorteo</span>
        <input
          type="text"
          maxLength={60}
          value={settings.title}
          onChange={(e) => patch({ title: e.target.value })}
          placeholder="Ej. Sorteo de fin de año"
        />
      </label>

      {/* Plantilla */}
      <div className="field">
        <span>Plantilla</span>
        <div className="template-grid">
          {TEMPLATES.map((t) => {
            const tp = getPalette(t.defaultPaletteId)
            return (
              <button
                key={t.id}
                className={`template-btn ${settings.templateId === t.id ? 'active' : ''}`}
                onClick={() => chooseTemplate(t.id)}
                disabled={disabled}
                title={t.tagline}
              >
                <span className="template-preview">
                  <span className="template-accent" style={{ background: t.accent }} />
                  {tp.colors.slice(0, 4).map((c, i) => (
                    <i key={i} style={{ background: c }} />
                  ))}
                </span>
                <span className="template-name">{t.name}</span>
                <span className="template-tag">{t.tagline}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Paleta */}
      <div className="field">
        <span>Paleta de la ruleta</span>
        <div className="theme-grid">
          {PALETTES.map((p) => (
            <button
              key={p.id}
              className={`theme-btn ${settings.paletteId === p.id && !settings.customColors ? 'active' : ''}`}
              onClick={() => choosePalette(p.id)}
              disabled={disabled}
              title={p.name}
            >
              <span className="theme-swatches">
                {p.colors.slice(0, 5).map((c, i) => (
                  <i key={i} style={{ background: c }} />
                ))}
              </span>
              <span className="theme-name">{p.name}</span>
            </button>
          ))}
        </div>
        <button
          className="text-btn palette-edit-toggle"
          onClick={() => setEditColors((v) => !v)}
          disabled={disabled}
        >
          {editColors ? 'Ocultar colores' : 'Personalizar colores'}
          {settings.customColors && <span className="dot-custom" title="Colores personalizados" />}
        </button>

        {editColors && (
          <div className="palette-editor">
            {effectiveColors.map((c, i) => (
              <label key={i} className="palette-chip" title={`Color ${i + 1}`}>
                <input
                  type="color"
                  value={c}
                  disabled={disabled}
                  onChange={(e) => setColorAt(i, e.target.value)}
                />
                <span style={{ background: c }} />
              </label>
            ))}
            {settings.customColors && (
              <button
                className="text-btn"
                onClick={() => patch({ customColors: null })}
                disabled={disabled}
              >
                Restablecer
              </button>
            )}
          </div>
        )}
      </div>

      <label className="field">
        <span>
          Cantidad de ganadores: <strong>{settings.numWinners}</strong>
        </span>
        <input
          type="range"
          min={1}
          max={MAX_WINNERS}
          value={settings.numWinners}
          disabled={disabled}
          onChange={(e) => patch({ numWinners: Number(e.target.value) })}
        />
        <small className="hint">
          El último en salir es el ganador; los previos quedan como suplentes.
        </small>
      </label>

      <div className="field">
        <span>Velocidad del giro</span>
        <div className="seg-control">
          {(['rapido', 'normal', 'dramatico'] as const).map((s) => (
            <button
              key={s}
              className={settings.spinSpeed === s ? 'active' : ''}
              onClick={() => patch({ spinSpeed: s })}
              disabled={disabled}
            >
              {s === 'rapido' ? 'Rápido' : s === 'normal' ? 'Normal' : 'Dramático'}
            </button>
          ))}
        </div>
      </div>

      <Toggle
        label="Eliminar al ganador de la ruleta"
        hint="Cada giro saca a alguien distinto."
        checked={settings.removeWinners}
        onChange={(v) => patch({ removeWinners: v })}
        disabled={disabled}
      />
      <Toggle
        label="Cuenta regresiva antes de girar"
        hint="Suspenso 3·2·1 antes de cada giro."
        checked={settings.countdown}
        onChange={(v) => patch({ countdown: v })}
        disabled={disabled}
      />
      <Toggle
        label="Sonidos"
        checked={settings.soundOn}
        onChange={(v) => patch({ soundOn: v })}
      />
    </section>
  )
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
  disabled,
}: {
  label: string
  hint?: string
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <label className={`toggle ${disabled ? 'disabled' : ''}`}>
      <span className="toggle-text">
        {label}
        {hint && <small>{hint}</small>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        className={`switch ${checked ? 'on' : ''}`}
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
      >
        <span className="knob" />
      </button>
    </label>
  )
}
