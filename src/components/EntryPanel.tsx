import { useState, useRef } from 'react'
import { Entry, uid, MAX_ENTRIES } from '../types'

interface EntryPanelProps {
  entries: Entry[]
  setEntries: (entries: Entry[]) => void
  setEntryColor: (id: string, color?: string) => void
  shuffle: () => void
  sortAlpha: () => void
  disabled: boolean
}

export function EntryPanel({
  entries,
  setEntries,
  setEntryColor,
  shuffle,
  sortAlpha,
  disabled,
}: EntryPanelProps) {
  const [text, setText] = useState(() => entries.map((e) => e.label).join('\n'))
  const colorInputRef = useRef<HTMLInputElement>(null)
  const editingIdRef = useRef<string | null>(null)

  // Sincroniza el textarea cuando entries cambia desde fuera (mezclar/ordenar/limpiar)
  const externalText = entries.map((e) => e.label).join('\n')
  if (document.activeElement?.tagName !== 'TEXTAREA' && externalText !== text) {
    setText(externalText)
  }

  const commit = (raw: string) => {
    setText(raw)
    const lines = raw
      .split('\n')
      .map((l) => l.replace(/\s+$/, ''))
      .filter((l) => l.trim().length > 0)
      .slice(0, MAX_ENTRIES)
    const colorByLabel = new Map<string, string | undefined>()
    for (const e of entries) if (e.color) colorByLabel.set(e.label, e.color)
    const next: Entry[] = lines.map((line) => {
      const label = line.trim()
      return { id: uid(), label, color: colorByLabel.get(label) }
    })
    setEntries(next)
  }

  const openColor = (id: string, current?: string) => {
    editingIdRef.current = id
    const input = colorInputRef.current
    if (!input) return
    input.value = current ?? '#7c5cdb'
    input.click()
  }

  const count = entries.length

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Participantes</h2>
        <span className={`counter ${count >= MAX_ENTRIES ? 'max' : ''}`}>
          {count}/{MAX_ENTRIES}
        </span>
      </div>

      <textarea
        className="entries-textarea"
        value={text}
        spellCheck={false}
        disabled={disabled}
        placeholder={'Un participante o premio por línea…\n\nAnyi\nMileth\nMariela\nRuben'}
        onChange={(e) => commit(e.target.value)}
      />

      <div className="entry-tools">
        <button className="btn btn-ghost sm" onClick={shuffle} disabled={disabled || count < 2}>
          Mezclar
        </button>
        <button className="btn btn-ghost sm" onClick={sortAlpha} disabled={disabled || count < 2}>
          Ordenar A–Z
        </button>
      </div>

      {count > 0 && (
        <div className="chip-list" role="list">
          {entries.map((e) => (
            <span className="chip" role="listitem" key={e.id}>
              <button
                className="chip-swatch"
                title="Color de este segmento"
                style={{ background: e.color ?? 'transparent' }}
                onClick={() => openColor(e.id, e.color)}
                disabled={disabled}
              >
                {!e.color && <span className="swatch-auto">A</span>}
              </button>
              <span className="chip-label">{e.label}</span>
              {e.color && (
                <button
                  className="chip-clear"
                  title="Quitar color personalizado"
                  onClick={() => setEntryColor(e.id, undefined)}
                >
                  ×
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      <input
        ref={colorInputRef}
        type="color"
        className="hidden-color"
        onChange={(e) => {
          if (editingIdRef.current) setEntryColor(editingIdRef.current, e.target.value)
        }}
        aria-hidden="true"
      />
    </section>
  )
}
