import { useReducer, useCallback } from 'react'
import { Entry, Settings, Winner, uid, MAX_ENTRIES, MAX_WINNERS } from '../types'

export interface RaffleState {
  /** Entradas originales (lista maestra editable por el usuario) */
  entries: Entry[]
  /** Entradas aún disponibles para girar (puede menguar si removeWinners) */
  pool: Entry[]
  settings: Settings
  winners: Winner[]
  /** Indica si el sorteo terminó (ya se sacaron todos los ganadores) */
  finished: boolean
}

const DEFAULT_ENTRIES: Entry[] = [
  'Anyi', 'Mileth', 'Mariela', 'Ruben', 'Miguel', 'Gabriel', 'Marisa',
].map((label) => ({ id: uid(), label }))

const DEFAULT_SETTINGS: Settings = {
  title: '',
  templateId: 'B',
  paletteId: 'vivo',
  customColors: null,
  numWinners: 1,
  removeWinners: false,
  spinSpeed: 'normal',
  soundOn: true,
  countdown: false,
  logo: null,
}

function initialState(): RaffleState {
  return {
    entries: DEFAULT_ENTRIES,
    pool: DEFAULT_ENTRIES,
    settings: DEFAULT_SETTINGS,
    winners: [],
    finished: false,
  }
}

type Action =
  | { type: 'setEntries'; entries: Entry[] }
  | { type: 'addEntry'; label: string }
  | { type: 'removeEntry'; id: string }
  | { type: 'editEntry'; id: string; label: string }
  | { type: 'setEntryColor'; id: string; color?: string }
  | { type: 'shuffle' }
  | { type: 'sortAlpha' }
  | { type: 'patchSettings'; patch: Partial<Settings> }
  | { type: 'recordWinner'; entry: Entry }
  | { type: 'resetDraw' }
  | { type: 'clearAll' }

function shuffleArr<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function reducer(state: RaffleState, action: Action): RaffleState {
  switch (action.type) {
    case 'setEntries': {
      const entries = action.entries.slice(0, MAX_ENTRIES)
      return { ...state, entries, pool: entries, winners: [], finished: false }
    }
    case 'addEntry': {
      if (state.entries.length >= MAX_ENTRIES) return state
      const label = action.label.trim()
      if (!label) return state
      const entries = [...state.entries, { id: uid(), label }]
      return { ...state, entries, pool: entries, winners: [], finished: false }
    }
    case 'removeEntry': {
      const entries = state.entries.filter((e) => e.id !== action.id)
      return { ...state, entries, pool: entries, winners: [], finished: false }
    }
    case 'editEntry': {
      const entries = state.entries.map((e) =>
        e.id === action.id ? { ...e, label: action.label } : e,
      )
      return { ...state, entries, pool: entries }
    }
    case 'setEntryColor': {
      const entries = state.entries.map((e) =>
        e.id === action.id ? { ...e, color: action.color } : e,
      )
      return { ...state, entries, pool: entries }
    }
    case 'shuffle': {
      const entries = shuffleArr(state.entries)
      return { ...state, entries, pool: entries, winners: [], finished: false }
    }
    case 'sortAlpha': {
      const entries = [...state.entries].sort((a, b) =>
        a.label.localeCompare(b.label, 'es'),
      )
      return { ...state, entries, pool: entries, winners: [], finished: false }
    }
    case 'patchSettings': {
      let numWinners = state.settings.numWinners
      if (action.patch.numWinners != null) {
        numWinners = Math.max(1, Math.min(MAX_WINNERS, action.patch.numWinners))
      }
      return {
        ...state,
        settings: { ...state.settings, ...action.patch, numWinners },
      }
    }
    case 'recordWinner': {
      const drawOrder = state.winners.length + 1
      const winners = [...state.winners, { entry: action.entry, drawOrder }]
      const pool = state.settings.removeWinners
        ? state.pool.filter((e) => e.id !== action.entry.id)
        : state.pool
      const finished =
        winners.length >= state.settings.numWinners || pool.length === 0
      return { ...state, winners, pool, finished }
    }
    case 'resetDraw': {
      return { ...state, pool: state.entries, winners: [], finished: false }
    }
    case 'clearAll': {
      return {
        entries: [],
        pool: [],
        settings: { ...state.settings, title: '', logo: null },
        winners: [],
        finished: false,
      }
    }
    default:
      return state
  }
}

export function useRaffle() {
  const [state, dispatch] = useReducer(reducer, undefined, initialState)

  const actions = {
    setEntries: useCallback((entries: Entry[]) => dispatch({ type: 'setEntries', entries }), []),
    addEntry: useCallback((label: string) => dispatch({ type: 'addEntry', label }), []),
    removeEntry: useCallback((id: string) => dispatch({ type: 'removeEntry', id }), []),
    editEntry: useCallback((id: string, label: string) => dispatch({ type: 'editEntry', id, label }), []),
    setEntryColor: useCallback((id: string, color?: string) => dispatch({ type: 'setEntryColor', id, color }), []),
    shuffle: useCallback(() => dispatch({ type: 'shuffle' }), []),
    sortAlpha: useCallback(() => dispatch({ type: 'sortAlpha' }), []),
    patchSettings: useCallback((patch: Partial<Settings>) => dispatch({ type: 'patchSettings', patch }), []),
    recordWinner: useCallback((entry: Entry) => dispatch({ type: 'recordWinner', entry }), []),
    resetDraw: useCallback(() => dispatch({ type: 'resetDraw' }), []),
    clearAll: useCallback(() => dispatch({ type: 'clearAll' }), []),
  }

  return { state, actions }
}
