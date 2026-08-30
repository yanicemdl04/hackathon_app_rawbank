import { io } from 'socket.io-client'
import { resolveMode } from './api'
import { mockBus } from './mockApi'

const SOCKET_URL = 'https://bankfraud.loophole.site'
const SOCKET_PATH = '/socket.io'

// Façade unique : les événements arrivent du bus local (mode démo)
// et/ou du vrai Socket.IO quand le backend est joignable.
let _facade = null
let _remote = null
const _registry = new Map() // evt -> Set(fn)

function ensureRemote() {
  resolveMode().then(mode => {
    if (mode !== 'remote' || _remote) return
    _remote = io(SOCKET_URL, {
      path: SOCKET_PATH,
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    })
    for (const [evt, fns] of _registry) fns.forEach(fn => _remote.on(evt, fn))
  })
}

export function getSocket() {
  if (_facade) return _facade
  _facade = {
    on(evt, fn) {
      if (!_registry.has(evt)) _registry.set(evt, new Set())
      _registry.get(evt).add(fn)
      mockBus.on(evt, fn)
      if (_remote) _remote.on(evt, fn)
    },
    off(evt, fn) {
      const fns = _registry.get(evt)
      if (fns) {
        const targets = fn ? [fn] : [...fns]
        targets.forEach(f => {
          fns.delete(f)
          mockBus.off(evt, f)
          if (_remote) _remote.off(evt, f)
        })
      } else {
        mockBus.off(evt, fn)
        if (_remote) _remote.off(evt, fn)
      }
    },
    emit(evt, data) {
      if (_remote) _remote.emit(evt, data)
    },
  }
  ensureRemote()
  return _facade
}

export function joinUser(userId) {
  getSocket().emit('join_user', userId)
}

export function disconnectSocket() {
  if (_remote) {
    _remote.disconnect()
    _remote = null
  }
}
