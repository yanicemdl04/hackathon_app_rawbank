import { mockFetch } from './mockApi'

const CONFIG_URL = 'https://bankfraud.loophole.site/bankapi/config'
const REMOTE_TIMEOUT_MS = 3000

let _config = null
let _mode = null            // 'remote' | 'mock'
let _modePromise = null

function announceMode(mode) {
  _mode = mode
  window.dispatchEvent(new CustomEvent('rawbank:mode', { detail: mode }))
}

export function getMode() { return _mode }

// Tente de joindre le backend distant ; bascule en simulation locale sinon.
export function resolveMode() {
  if (_modePromise) return _modePromise
  _modePromise = (async () => {
    try {
      const ctrl = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), REMOTE_TIMEOUT_MS)
      const res = await fetch(CONFIG_URL, { signal: ctrl.signal })
      clearTimeout(timer)
      if (!res.ok) throw new Error('config unavailable')
      _config = await res.json()
      announceMode('remote')
    } catch {
      announceMode('mock')
    }
    return _mode
  })()
  return _modePromise
}

class ApiError extends Error {
  constructor(status, body) {
    super(body?.message || `HTTP ${status}`)
    this.status = status
    this.body = body
  }
}

async function remoteFetch(path, options) {
  const base = _config.apiVersionedUrl
  const url = path.startsWith('http') ? path : `${base}${path}`
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  })
  const text = await res.text()
  let data
  try { data = JSON.parse(text) } catch { data = { message: text } }
  if (!res.ok) throw new ApiError(res.status, data)
  return data
}

export async function apiFetch(path, options = {}) {
  const mode = await resolveMode()
  if (mode === 'mock') return mockFetch(path, options)
  try {
    return await remoteFetch(path, options)
  } catch (err) {
    // Vraie réponse HTTP du backend → on la propage telle quelle
    if (err instanceof ApiError) throw err
    // Panne réseau → bascule définitive en simulation locale
    announceMode('mock')
    return mockFetch(path, options)
  }
}

export const api = {
  get: (path) => apiFetch(path),
  post: (path, body) => apiFetch(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path, body) => apiFetch(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch: (path, body) => apiFetch(path, { method: 'PATCH', body: JSON.stringify(body) }),
}
