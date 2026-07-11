// Cliente de la API de sorteos con registro por link (/api/raffles)
// y almacenamiento local de la llave de administrador del organizador.

export interface LiveInfo {
  slug: string
  title: string
  isPrivate: boolean
  status: 'open' | 'closed'
  count: number
  max: number
  expiresAt: number
}

export interface LiveParticipant {
  id: number
  name: string
}

export interface AdminRaffle {
  slug: string
  title: string
  token: string
  pin: string | null
  expiresAt: number
}

interface ApiError {
  ok: false
  error: string
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(path, init)
  } catch {
    throw new Error('Sin conexión. Revisa tu internet e intenta de nuevo.')
  }
  let data: unknown = null
  try {
    data = await res.json()
  } catch {
    /* respuesta sin JSON */
  }
  if (!res.ok || !(data as { ok?: boolean })?.ok) {
    const msg = (data as ApiError)?.error || 'Algo salió mal. Intenta de nuevo.'
    throw new Error(msg)
  }
  return data as T
}

export function createRaffle(input: { title: string; slug?: string; pin?: string }) {
  return call<LiveInfo & { adminToken: string; pin: string | null }>('/api/raffles', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  })
}

export function getRaffleInfo(slug: string) {
  return call<LiveInfo>(`/api/raffles/${encodeURIComponent(slug)}`)
}

export function joinRaffle(slug: string, name: string, pin?: string) {
  return call<{ ok: true; name: string; count: number }>(
    `/api/raffles/${encodeURIComponent(slug)}/join`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(pin ? { name, pin } : { name }),
    },
  )
}

export function getParticipants(slug: string, token: string) {
  return call<LiveInfo & { participants: LiveParticipant[] }>(
    `/api/raffles/${encodeURIComponent(slug)}/participants?token=${encodeURIComponent(token)}`,
  )
}

export function patchRaffle(
  slug: string,
  token: string,
  patch: { status?: 'open' | 'closed'; newSlug?: string },
) {
  return call<LiveInfo>(`/api/raffles/${encodeURIComponent(slug)}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ token, ...patch }),
  })
}

export function deleteRaffle(slug: string, token: string) {
  return call<{ ok: true }>(
    `/api/raffles/${encodeURIComponent(slug)}?token=${encodeURIComponent(token)}`,
    { method: 'DELETE' },
  )
}

// ── Link para compartir ──────────────────────────────────────────────────
export function shareLink(slug: string): string {
  return `${window.location.origin}/#/s/${slug}`
}

// ── Llave de administrador en este navegador ─────────────────────────────
const ADMIN_KEY = 'live-admin-v1'

export function loadAdminRaffle(): AdminRaffle | null {
  try {
    const raw = localStorage.getItem(ADMIN_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as AdminRaffle
    if (!data?.slug || !data?.token) return null
    if (data.expiresAt && data.expiresAt * 1000 < Date.now()) {
      localStorage.removeItem(ADMIN_KEY)
      return null
    }
    return data
  } catch {
    return null
  }
}

export function saveAdminRaffle(r: AdminRaffle): void {
  try {
    localStorage.setItem(ADMIN_KEY, JSON.stringify(r))
  } catch {
    /* almacenamiento lleno o bloqueado */
  }
}

export function clearAdminRaffle(): void {
  try {
    localStorage.removeItem(ADMIN_KEY)
  } catch {
    /* nada */
  }
}
