import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { useRaffle } from './state/useRaffle'
import { Wheel, WheelHandle } from './components/Wheel'
import { EntryPanel } from './components/EntryPanel'
import { SettingsPanel } from './components/SettingsPanel'
import { LogoUpload } from './components/LogoUpload'
import { WinnerModal } from './components/WinnerModal'
import { Podium } from './components/Podium'
import { Confetti } from './components/Confetti'
import { Decorations } from './components/Decorations'
import { SponsorBanner } from './components/SponsorBanner'
import { ModeSwitcher, AppMode } from './components/ModeSwitcher'
import { SocialRaffle } from './components/social/SocialRaffle'
import { JoinPage } from './components/live/JoinPage'
import { LivePanel } from './components/live/LivePanel'
import { getTemplate } from './templates'
import { getPalette, textColorFor } from './palettes'
import { isEnabled } from './config/features'
import { Entry } from './types'
import { setMuted, beep, fanfare } from './audio'

type Phase = 'idle' | 'counting' | 'spinning' | 'revealed' | 'done'

/** #/s/mi-sorteo → "mi-sorteo" (página de registro de participantes) */
function joinSlugFromHash(): string | null {
  const m = window.location.hash.match(/^#\/s\/([a-z0-9-]{2,40})\/?$/i)
  return m ? m[1].toLowerCase() : null
}

export default function App() {
  const { state, actions } = useRaffle()
  const { entries, pool, settings, winners, finished } = state

  const template = useMemo(() => getTemplate(settings.templateId), [settings.templateId])
  const palette = useMemo(() => getPalette(settings.paletteId), [settings.paletteId])
  const colors = useMemo(
    () => (settings.customColors && settings.customColors.length ? settings.customColors : palette.colors),
    [settings.customColors, palette],
  )
  const accent = template.accent

  const socialEnabled = isEnabled('socialRaffle')
  const sponsorEnabled = isEnabled('sponsorBanner')
  const [mode, setMode] = useState<AppMode>('wheel')

  const [joinSlug, setJoinSlug] = useState<string | null>(() => joinSlugFromHash())
  useEffect(() => {
    const onHash = () => setJoinSlug(joinSlugFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const wheelRef = useRef<WheelHandle>(null)
  const [phase, setPhase] = useState<Phase>('idle')
  const [modal, setModal] = useState<{ entry: Entry; drawOrder: number } | null>(null)
  const [confettiBurst, setConfettiBurst] = useState(0)
  const [countNum, setCountNum] = useState<number | null>(null)
  const stageRef = useRef<HTMLDivElement>(null)

  const totalPlanned = settings.removeWinners
    ? Math.min(settings.numWinners, entries.length)
    : settings.numWinners

  // Refs vivas para evitar cierres obsoletos al girar
  const phaseRef = useRef(phase)
  const poolLenRef = useRef(pool.length)
  const finishedRef = useRef(finished)
  const countdownRef = useRef(settings.countdown)
  phaseRef.current = phase
  poolLenRef.current = pool.length
  finishedRef.current = finished
  countdownRef.current = settings.countdown

  useEffect(() => setMuted(!settings.soundOn), [settings.soundOn])

  const doSpin = useCallback(() => {
    setPhase('spinning')
    wheelRef.current?.spin()
  }, [])

  const startSpin = useCallback(() => {
    if (phaseRef.current === 'spinning' || phaseRef.current === 'counting') return
    if (poolLenRef.current === 0 || finishedRef.current) return
    if (countdownRef.current) {
      setPhase('counting')
      let n = 3
      setCountNum(n)
      beep()
      const iv = setInterval(() => {
        n -= 1
        if (n <= 0) {
          clearInterval(iv)
          setCountNum(null)
          beep(true)
          doSpin()
        } else {
          setCountNum(n)
          beep()
        }
      }, 800)
    } else {
      doSpin()
    }
  }, [doSpin])

  const onSpinEnd = useCallback(
    (winner: Entry) => {
      const drawOrder = winners.length + 1
      actions.recordWinner(winner)
      setModal({ entry: winner, drawOrder })
      setConfettiBurst((b) => b + 1)
      fanfare(drawOrder >= totalPlanned)
      setPhase('revealed')
    },
    [winners.length, totalPlanned, actions],
  )

  const continueDraw = useCallback(() => {
    setModal(null)
    setTimeout(() => startSpin(), 250)
  }, [startSpin])

  const closeModal = useCallback(() => {
    setModal(null)
    setPhase(finishedRef.current ? 'done' : 'idle')
  }, [])

  // Reinicia la ronda (conserva los participantes) y vuelve a girar
  const resetAndSpin = useCallback(() => {
    actions.resetDraw()
    setModal(null)
    setPhase('idle')
    setTimeout(() => startSpin(), 90)
  }, [actions, startSpin])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !modal && mode === 'wheel') {
        const tag = (e.target as HTMLElement)?.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA') return
        e.preventDefault()
        if (finishedRef.current) resetAndSpin()
        else if (poolLenRef.current > 0) startSpin()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [startSpin, resetAndSpin, modal, mode])

  const clearAll = useCallback(() => {
    actions.clearAll()
    setPhase('idle')
    setModal(null)
  }, [actions])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) stageRef.current?.requestFullscreen?.()
    else document.exitFullscreen?.()
  }

  const modalRank = modal ? totalPlanned - modal.drawOrder + 1 : 0
  const hasMore = winners.length < totalPlanned && pool.length > 0
  const busy = phase === 'spinning' || phase === 'counting'
  const accentText = textColorFor(accent)
  const showSocial = socialEnabled && mode === 'social'

  // Página de registro para participantes (link compartido #/s/…)
  if (joinSlug) {
    return (
      <div
        className="app"
        data-template={settings.templateId}
        style={{ ['--accent' as string]: accent, ['--accent-text' as string]: accentText }}
      >
        <div className="bg-soft" aria-hidden="true" />
        <Decorations template={template.id} />
        <JoinPage slug={joinSlug} />
      </div>
    )
  }

  return (
    <div
      className="app"
      data-template={settings.templateId}
      style={{ ['--accent' as string]: accent, ['--accent-text' as string]: accentText }}
    >
      <div className="bg-soft" aria-hidden="true" />
      <Decorations template={template.id} />

      <div className="notice-bar" role="note">
        ✨ Próximamente: sorteos de comentarios en Instagram, TikTok y Facebook
      </div>

      {sponsorEnabled && <SponsorBanner />}

      {socialEnabled && (
        <header className="topbar">
          <ModeSwitcher mode={mode} onChange={setMode} />
        </header>
      )}

      {showSocial ? (
        <main className="layout social-layout">
          <SocialRaffle accent={accent} colors={colors} />
        </main>
      ) : (
        <main className="layout">
          <section className="stage-wrap" ref={stageRef}>
            <div className="stage-head">
              <h1 className="raffle-title">{settings.title || 'Sorteo'}</h1>
              <button
                className="icon-btn fullscreen-btn"
                onClick={toggleFullscreen}
                title="Pantalla completa"
                aria-label="Pantalla completa"
              >⛶</button>
            </div>

            <div className="wheel-area">
              <Wheel
                ref={wheelRef}
                pool={pool}
                template={template}
                colors={colors}
                logo={settings.logo}
                spinSpeed={settings.spinSpeed}
                soundOn={settings.soundOn}
                onRequestSpin={() => (finished ? resetAndSpin() : startSpin())}
                onSpinEnd={onSpinEnd}
              />
              {countNum !== null && (
                <div className="countdown" key={countNum}>
                  {countNum}
                </div>
              )}
            </div>

            <div className="stage-controls">
              {busy ? (
                <button className="spin-btn" disabled>Girando…</button>
              ) : pool.length === 0 ? (
                <button className="spin-btn" disabled>Agrega participantes</button>
              ) : finished ? (
                <button className="spin-btn" onClick={resetAndSpin}>↻ Girar de nuevo</button>
              ) : (
                <button className="spin-btn" onClick={startSpin}>Girar la ruleta</button>
              )}
              <div className="control-meta">
                <span className="hint-line">
                  {settings.numWinners > 1 && !finished
                    ? `Sacando ${winners.length}/${totalPlanned} · Espacio o clic en la ruleta`
                    : 'Pulsa Espacio o haz clic en la ruleta'}
                </span>
                {entries.length > 0 && (
                  <button className="text-btn" onClick={clearAll} title="Borrar todos los participantes">
                    Vaciar lista
                  </button>
                )}
              </div>
            </div>

            {phase === 'done' && totalPlanned > 1 && (
              <Podium
                winners={winners}
                totalPlanned={totalPlanned}
                onReset={resetAndSpin}
                onNewDraw={clearAll}
              />
            )}

            {/* Dentro del escenario para que se vean también en pantalla completa */}
            <WinnerModal
              winner={modal?.entry ?? null}
              rank={modalRank}
              totalWinners={totalPlanned}
              accent={accent}
              hasMore={hasMore}
              onClose={closeModal}
              onContinue={continueDraw}
              onSpinAgain={resetAndSpin}
            />
            <Confetti burst={confettiBurst} colors={colors} />
          </section>

          <aside className="sidebar">
            <EntryPanel
              entries={entries}
              setEntries={actions.setEntries}
              setEntryColor={actions.setEntryColor}
              shuffle={actions.shuffle}
              sortAlpha={actions.sortAlpha}
              disabled={busy}
            />
            <LivePanel setEntries={actions.setEntries} disabled={busy} />
            <SettingsPanel settings={settings} patch={actions.patchSettings} disabled={busy} />
            <LogoUpload logo={settings.logo} setLogo={(l) => actions.patchSettings({ logo: l })} />
          </aside>
        </main>
      )}

      <footer className="site-footer">
        <a href="https://borenstudio.com" target="_blank" rel="noopener noreferrer">
          powered by <strong>Boren Studio</strong>
        </a>
      </footer>

    </div>
  )
}
