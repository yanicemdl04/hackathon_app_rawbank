// ════════════════════════════════════════════════════════════
// MOCK BACKEND — simulation complète en mémoire + localStorage
// Utilisé automatiquement quand le backend distant est injoignable.
// ════════════════════════════════════════════════════════════
import { toast } from 'sonner'

// ── Bus d'événements local (remplace Socket.IO en mode démo) ──
const _listeners = new Map()
export const mockBus = {
  on(evt, fn) {
    if (!_listeners.has(evt)) _listeners.set(evt, new Set())
    _listeners.get(evt).add(fn)
  },
  off(evt, fn) {
    const set = _listeners.get(evt)
    if (!set) return
    if (fn) set.delete(fn)
    else set.clear()
  },
  emit(evt, data) {
    const set = _listeners.get(evt)
    if (set) [...set].forEach(fn => { try { fn(data) } catch { /* noop */ } })
  },
}
function emitLater(evt, data, delay = 400) {
  setTimeout(() => mockBus.emit(evt, data), delay)
}

// ── Localisations disponibles ──
const LOCATIONS = [
  { code: 'KINSHASA',     ville: 'Kinshasa',     pays: 'RDC',            latitude: -4.325,  longitude: 15.322 },
  { code: 'LUBUMBASHI',   ville: 'Lubumbashi',   pays: 'RDC',            latitude: -11.660, longitude: 27.480 },
  { code: 'GOMA',         ville: 'Goma',         pays: 'RDC',            latitude: -1.680,  longitude: 29.220 },
  { code: 'MATADI',       ville: 'Matadi',       pays: 'RDC',            latitude: -5.820,  longitude: 13.450 },
  { code: 'KISANGANI',    ville: 'Kisangani',    pays: 'RDC',            latitude: 0.520,   longitude: 25.190 },
  { code: 'JOHANNESBURG', ville: 'Johannesburg', pays: 'Afrique du Sud', latitude: -26.200, longitude: 28.050 },
  { code: 'NAIROBI',      ville: 'Nairobi',      pays: 'Kenya',          latitude: -1.290,  longitude: 36.820 },
  { code: 'LAGOS',        ville: 'Lagos',        pays: 'Nigéria',        latitude: 6.520,   longitude: 3.380 },
  { code: 'PARIS',        ville: 'Paris',        pays: 'France',         latitude: 48.860,  longitude: 2.350 },
  { code: 'BRUXELLES',    ville: 'Bruxelles',    pays: 'Belgique',       latitude: 50.850,  longitude: 4.350 },
  { code: 'DUBAI',        ville: 'Dubaï',        pays: 'É.A.U.',         latitude: 25.200,  longitude: 55.270 },
  { code: 'NEW_YORK',     ville: 'New York',     pays: 'États-Unis',     latitude: 40.710,  longitude: -74.000 },
]

// ── Base de données persistée ──
const DB_KEY = 'rawbank_mock_db_v1'
function freshDb() {
  return {
    users: {},
    otps: {},          // clé: userId ou txId → code
    transactions: [],
    disputes: [],
    travels: [],
    model: { lastRetrainAt: null, transactionsSinceRetrain: 87 },
    seq: 1024,
  }
}
let db = (() => {
  try { return { ...freshDb(), ...JSON.parse(localStorage.getItem(DB_KEY)) } } catch { return freshDb() }
})()
function save() { try { localStorage.setItem(DB_KEY, JSON.stringify(db)) } catch { /* quota */ } }

// ── Utilitaires ──
const rid = (p) => p + '_' + Math.random().toString(36).slice(2, 10)
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]
const delay = (ms) => new Promise(r => setTimeout(r, ms))
function httpError(status, message, extra = {}) {
  const err = new Error(message)
  err.status = status
  err.body = { message, ...extra }
  return err
}
function genOtp(key) {
  const code = String(rand(100000, 999999))
  db.otps[key] = code
  save()
  toast.info(`Code OTP (démo) : ${code}`, { duration: 12000 })
  return code
}
function maskEmail(email) {
  const [a, b] = (email || 'demo@rawbank.cd').split('@')
  return a.slice(0, 2) + '•••@' + b
}
// pseudo-aléatoire stable par graine (timeline reproductible)
function seeded(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) }
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    return ((h ^= h >>> 16) >>> 0) / 4294967296
  }
}

// ── Moteur de scoring (simulation IA) ──
function scoreTransaction(input, user) {
  let score = rand(6, 16)
  const reasons = []
  const avg = Math.max(Number(input.montantMoyenClient) || 150, 1)
  const ratio = Number(input.amount) / avg

  if (ratio > 10)      { score += 45; reasons.push(`Montant ${ratio.toFixed(0)}× supérieur à votre moyenne habituelle`) }
  else if (ratio > 5)  { score += 30; reasons.push(`Montant ${ratio.toFixed(1)}× supérieur à votre moyenne habituelle`) }
  else if (ratio > 2.5){ score += 15; reasons.push('Montant sensiblement supérieur à vos habitudes') }

  if (input.nouvelAppareil)      { score += 18; reasons.push('Transaction initiée depuis un nouvel appareil') }
  if (input.nouvelleLocalisation){ score += 15; reasons.push('Localisation inhabituelle détectée') }

  if (input.transactionInternationale) {
    const now = Date.now()
    const covered = db.travels.some(t =>
      t.userId === user.id && t.active && !t.cancelled &&
      new Date(t.startDate).getTime() <= now && new Date(t.endDate).getTime() >= now
    )
    if (covered) { score += 4; reasons.push('Transaction internationale couverte par une déclaration de voyage') }
    else         { score += 22; reasons.push('Transaction internationale sans déclaration de voyage') }
  }

  const n1h = Number(input.nbTransactions1h) || 0
  const n24h = Number(input.nbTransactions24h) || 0
  if (n1h > 5)       { score += 15; reasons.push(`Fréquence élevée : ${n1h} transactions en 1h`) }
  else if (n1h > 3)  { score += 8;  reasons.push('Fréquence de transactions au-dessus de la normale') }
  if (n24h > 15)     { score += 10; reasons.push(`Volume important : ${n24h} transactions en 24h`) }

  if ((Number(input.ratioEcartMontant) || 1) > 4) { score += 8; reasons.push('Écart-type de montant anormal') }

  score = Math.min(Math.round(score), 100)
  const status = score < 35 ? 'OK' : score < 65 ? 'VERIFY' : 'BLOCK'
  if (status === 'OK' && reasons.length === 0) {
    reasons.push('Montant conforme à vos habitudes', 'Appareil et localisation reconnus')
  }
  return { score, status, reasons }
}

// ── Génération de transactions de démo ──
const TX_TYPES = ['TRANSFERT', 'RETRAIT', 'DEPOT', 'PAIEMENT']
const TX_CANAUX = ['MOBILE', 'USSD', 'WEB', 'POS', 'GAB']
const TX_APPAREILS = ['ANDROID', 'IOS', 'WEB', 'FEATURE_PHONE']
function makeTx(userId, overrides = {}) {
  db.seq += 1
  const loc = pick(LOCATIONS.slice(0, 5))
  const score = overrides.riskScore ?? rand(4, 96)
  const status = overrides.status ?? (score < 35 ? 'OK' : score < 65 ? (Math.random() < .6 ? 'VERIFIED_BY_USER' : 'VERIFY') : 'BLOCK')
  return {
    id: rid('tx'),
    numero: 'TX-' + String(db.seq).padStart(6, '0'),
    userId,
    amount: overrides.amount ?? rand(10, 2400),
    devise: overrides.devise ?? pick(['USD', 'USD', 'CDF']),
    typeTransaction: pick(TX_TYPES),
    canalTransaction: pick(TX_CANAUX),
    typeAppareil: pick(TX_APPAREILS),
    typeReseau: pick(['G3', 'G4', 'WIFI']),
    villeOrigine: loc.ville,
    villeDestination: overrides.villeDestination ?? pick(LOCATIONS).ville,
    nouvelAppareil: score > 60 && Math.random() < .5,
    nouvelleLocalisation: score > 50 && Math.random() < .5,
    nbTransactions1h: rand(0, 4),
    nbTransactions24h: rand(1, 12),
    riskScore: score,
    status,
    reasons: status === 'OK'
      ? ['Montant conforme à vos habitudes', 'Appareil reconnu']
      : status === 'BLOCK'
        ? ['Montant très supérieur à la moyenne', 'Localisation inhabituelle détectée']
        : ['Montant sensiblement supérieur à vos habitudes'],
    requiresManualReview: status === 'BLOCK',
    aiResponseTimeMs: rand(80, 320),
    timestamp: overrides.timestamp ?? new Date(Date.now() - rand(0, 14) * 86400000 - rand(0, 86400000)).toISOString(),
    ...overrides,
  }
}
function ensureSeedTx(userId) {
  if (db.transactions.some(t => t.userId === userId)) return
  for (let i = 0; i < 22; i++) db.transactions.push(makeTx(userId))
  db.transactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  save()
}

function publicUser(u) {
  return {
    id: u.id, name: u.name, email: u.email, phoneNumber: u.phoneNumber,
    accountType: u.accountType, riskScore: u.riskScore, accountFrozen: !!u.accountFrozen,
  }
}

// ════════════════════════════════════════════════════════════
// ROUTEUR
// ════════════════════════════════════════════════════════════
export async function mockFetch(path, options = {}) {
  await delay(rand(220, 550))
  const method = (options.method || 'GET').toUpperCase()
  const body = options.body ? JSON.parse(options.body) : {}
  const url = new URL(path, 'http://mock.local')
  const p = url.pathname.replace(/\/+$/, '')
  const q = url.searchParams
  const seg = p.split('/').filter(Boolean)

  // ── AUTH ──
  if (method === 'POST' && p === '/auth/login-or-register') {
    const phone = (body.phoneNumber || '').trim()
    if (!phone) throw httpError(400, 'Numéro de téléphone requis')
    let user = Object.values(db.users).find(u => u.phoneNumber === phone)
    if (!user) {
      user = {
        id: rid('u'), phoneNumber: phone,
        email: body.email || 'demo@rawbank.cd',
        name: body.name || 'Client Rawbank',
        accountType: 'PREMIUM', riskScore: rand(8, 28), accountFrozen: false,
        location: LOCATIONS[0],
      }
      db.users[user.id] = user
    } else {
      if (body.email) user.email = body.email
      if (body.name) user.name = body.name
    }
    save()
    genOtp(user.id)
    return { userId: user.id, otpSentTo: maskEmail(user.email) }
  }

  if (method === 'POST' && p === '/auth/verify-otp') {
    const user = db.users[body.userId]
    if (!user) throw httpError(410, 'Session expirée. Veuillez vous reconnecter.')
    const expected = db.otps[user.id]
    if (body.code !== expected && body.code !== '123456') {
      throw httpError(401, 'Code incorrect', { remainingAttempts: 2 })
    }
    delete db.otps[user.id]
    ensureSeedTx(user.id)
    save()
    return publicUser(user)
  }

  // ── LOCATIONS ──
  if (method === 'GET' && p === '/locations') return { locations: LOCATIONS }

  // ── TRANSACTIONS ──
  if (method === 'GET' && p === '/transactions') {
    const userId = q.get('userId')
    const status = q.get('status')
    const page = Number(q.get('page')) || 1
    const pageSize = Number(q.get('pageSize')) || 15
    let items = db.transactions.filter(t => !userId || t.userId === userId)
    if (status) items = items.filter(t => t.status === status)
    const totalPages = Math.max(Math.ceil(items.length / pageSize), 1)
    return {
      items: items.slice((page - 1) * pageSize, page * pageSize),
      pagination: { page, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
    }
  }

  if (method === 'POST' && p === '/transactions') {
    const user = db.users[body.userId]
    if (!user) throw httpError(401, 'Utilisateur inconnu')
    if (user.accountFrozen) throw httpError(403, 'Compte gelé : transaction refusée.')
    const { score, status, reasons } = scoreTransaction(body, user)
    db.seq += 1
    const tx = {
      ...body,
      id: rid('tx'),
      numero: 'TX-' + String(db.seq).padStart(6, '0'),
      riskScore: score, status, reasons,
      requiresManualReview: status === 'BLOCK',
      aiResponseTimeMs: rand(90, 340),
      timestamp: new Date().toISOString(),
    }
    db.transactions.unshift(tx)
    db.model.transactionsSinceRetrain += 1
    save()
    emitLater('transaction:scored', {
      transactionId: tx.id, status, riskScore: score, reasons,
      amount: tx.amount, devise: tx.devise,
    })
    if (status === 'BLOCK' && user.accountType === 'PREMIUM') {
      emitLater('premium:fraud-alert', {
        transactionId: tx.id, userName: user.name, amount: tx.amount,
        devise: tx.devise, riskScore: score,
      }, 900)
    }
    emitLater('ai:stats-updated', aiStats(), 1200)
    if (status === 'VERIFY') {
      genOtp(tx.id)
      return {
        requiresOtp: true, transactionId: tx.id, otpSentTo: maskEmail(user.email),
        status, riskScore: score, reasons, aiResponseTimeMs: tx.aiResponseTimeMs,
      }
    }
    return {
      transactionId: tx.id, status, riskScore: score, reasons,
      requiresManualReview: tx.requiresManualReview, aiResponseTimeMs: tx.aiResponseTimeMs,
      message: status === 'BLOCK' ? 'Transaction bloquée par le système anti-fraude.' : 'Transaction approuvée.',
    }
  }

  if (method === 'POST' && seg[0] === 'transactions' && seg[2] === 'verify-otp') {
    const tx = db.transactions.find(t => t.id === seg[1])
    if (!tx) throw httpError(404, 'Transaction introuvable')
    const expected = db.otps[tx.id]
    if (body.code !== expected && body.code !== '123456') throw httpError(401, 'Code incorrect')
    delete db.otps[tx.id]
    tx.status = 'VERIFIED_BY_USER'
    save()
    emitLater('transaction:verified', { transactionId: tx.id, status: tx.status, riskScore: tx.riskScore })
    return {
      transactionId: tx.id, status: 'VERIFIED_BY_USER', riskScore: tx.riskScore,
      reasons: tx.reasons, message: 'Identité confirmée — transaction validée.',
    }
  }

  if (method === 'POST' && seg[0] === 'transactions' && seg[2] === 'resend-otp') {
    const tx = db.transactions.find(t => t.id === seg[1])
    if (!tx) throw httpError(404, 'Transaction introuvable')
    genOtp(tx.id)
    return { message: 'Code renvoyé.' }
  }

  if (method === 'GET' && seg[0] === 'transactions' && seg[2] === 'trace') {
    const tx = db.transactions.find(t => t.id === seg[1])
    if (!tx) throw httpError(404, 'Transaction introuvable')
    return {
      trace: {
        ipAddress: `41.243.${rand(1, 254)}.${rand(1, 254)}`,
        deviceFingerprint: 'fp_' + Math.random().toString(36).slice(2, 18),
        userAgent: navigator.userAgent,
      },
      userHistory: {
        knownDevices: ['ANDROID · Samsung A54', 'WEB · Chrome 126'],
        knownIPs: ['41.243.11.7', '41.243.88.140', '102.22.4.19'],
      },
      disputes: db.disputes.filter(d => d.transactionId === tx.id),
    }
  }

  if (method === 'GET' && seg[0] === 'transactions' && seg.length === 2) {
    const tx = db.transactions.find(t => t.id === seg[1])
    if (!tx) throw httpError(404, 'Transaction introuvable')
    return tx
  }

  // ── USERS ──
  if (method === 'PUT' && seg[0] === 'users' && seg[2] === 'simulate-location') {
    const user = db.users[seg[1]]
    if (!user) throw httpError(404, 'Utilisateur introuvable')
    const loc = LOCATIONS.find(l => l.code === body.location)
    if (!loc) throw httpError(400, 'Localisation inconnue')
    user.location = loc
    save()
    return { ...loc, message: `Position mise à jour : ${loc.ville}` }
  }

  if (method === 'POST' && seg[0] === 'users' && seg[2] === 'unfreeze') {
    const user = db.users[seg[1]]
    if (user) { user.accountFrozen = false; save() }
    emitLater('account:unfrozen', { reason: 'Levée du gel (simulation démo)' }, 200)
    return { message: 'Compte dégelé.' }
  }

  if (method === 'POST' && p === '/users/seed-demo') {
    const users = []
    for (let i = 0; i < 3; i++) {
      const u = {
        id: rid('u'), phoneNumber: '+24381' + rand(1000000, 9999999),
        email: `demo${rand(10, 99)}@rawbank.cd`, name: pick(['Amina K.', 'Patrice M.', 'Grace T.', 'Didier L.', 'Sarah N.']),
        accountType: pick(['PREMIUM', 'STANDARD']), riskScore: rand(5, 40), accountFrozen: false,
      }
      db.users[u.id] = u
      for (let j = 0; j < 8; j++) db.transactions.push(makeTx(u.id))
      users.push(publicUser(u))
    }
    db.transactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    save()
    emitLater('ai:stats-updated', aiStats(), 500)
    return { users, message: 'Utilisateurs de démo créés.' }
  }

  // ── VOYAGES ──
  if (method === 'POST' && seg[0] === 'users' && seg[2] === 'declare-travel') {
    const decl = {
      id: rid('tr'), userId: seg[1],
      destination: body.destination, pays: body.pays,
      latitude: body.latitude, longitude: body.longitude,
      startDate: body.startDate, endDate: body.endDate,
      active: true, cancelled: false, createdAt: new Date().toISOString(),
    }
    db.travels.unshift(decl)
    save()
    return decl
  }
  if (method === 'GET' && seg[0] === 'users' && seg[2] === 'travel' && seg[3] === 'active') {
    const now = Date.now()
    return {
      declarations: db.travels.filter(t =>
        t.userId === seg[1] && !t.cancelled &&
        new Date(t.endDate).getTime() >= now
      ).map(t => ({ ...t, active: true })),
    }
  }
  if (method === 'POST' && seg[0] === 'users' && seg[2] === 'travel' && seg[4] === 'cancel') {
    const decl = db.travels.find(t => t.id === seg[3])
    if (!decl) throw httpError(404, 'Déclaration introuvable')
    decl.cancelled = true
    decl.active = false
    save()
    return { message: 'Voyage annulé.' }
  }
  if (method === 'GET' && seg[0] === 'users' && seg[2] === 'travel') {
    const now = Date.now()
    return {
      declarations: db.travels
        .filter(t => t.userId === seg[1])
        .map(t => ({ ...t, active: !t.cancelled && new Date(t.endDate).getTime() >= now })),
    }
  }

  // ── DISPUTES ──
  if (method === 'GET' && p === '/disputes/stats') {
    const stats = { OPEN: 0, INVESTIGATING: 0, CONFIRMED: 0, REJECTED: 0, RESOLVED: 0 }
    db.disputes.forEach(d => { if (stats[d.status] !== undefined) stats[d.status] += 1 })
    return stats
  }
  if (method === 'GET' && p === '/disputes') {
    const userId = q.get('userId')
    const status = q.get('status')
    const page = Number(q.get('page')) || 1
    const pageSize = Number(q.get('pageSize')) || 15
    let items = db.disputes.filter(d => !userId || d.userId === userId)
    if (status) items = items.filter(d => d.status === status)
    const totalPages = Math.max(Math.ceil(items.length / pageSize), 1)
    return {
      items: items.slice((page - 1) * pageSize, page * pageSize),
      pagination: { page, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
    }
  }
  if (method === 'POST' && p === '/disputes') {
    const dispute = {
      id: rid('dsp'), transactionId: body.transactionId, userId: body.userId,
      reason: body.reason || 'Transaction non autorisée',
      description: body.description || '',
      status: 'OPEN', resolution: null, createdAt: new Date().toISOString(),
    }
    db.disputes.unshift(dispute)
    const user = db.users[body.userId]
    if (user) user.accountFrozen = true
    save()
    emitLater('dispute:opened', { disputeId: dispute.id, reason: dispute.reason }, 300)
    emitLater('account:frozen', { reason: 'Signalement de fraude en cours d\'examen' }, 800)
    return { ...dispute, message: 'Signalement enregistré. Votre compte a été temporairement gelé par mesure de sécurité.' }
  }
  if (method === 'GET' && seg[0] === 'disputes' && seg.length === 2) {
    const d = db.disputes.find(x => x.id === seg[1])
    if (!d) throw httpError(404, 'Signalement introuvable')
    return d
  }
  if (method === 'PATCH' && seg[0] === 'disputes' && seg.length === 2) {
    const d = db.disputes.find(x => x.id === seg[1])
    if (!d) throw httpError(404, 'Signalement introuvable')
    d.status = body.status || d.status
    d.resolution = body.resolution || d.resolution
    if (d.status === 'CONFIRMED') {
      const tx = db.transactions.find(t => t.id === d.transactionId)
      if (tx) tx.status = 'FRAUD_CONFIRMED'
    }
    if (d.status === 'RESOLVED' || d.status === 'REJECTED') {
      const user = db.users[d.userId]
      if (user) user.accountFrozen = false
      emitLater('account:unfrozen', { reason: 'Dossier clôturé' }, 600)
    }
    save()
    emitLater('dispute:updated', { disputeId: d.id, newStatus: d.status }, 300)
    return d
  }

  // ── IA ──
  if (method === 'GET' && p === '/ai/stats') return aiStats()
  if (method === 'GET' && p === '/ai/stats/timeline') {
    const days = Number(q.get('days')) || 14
    const data = []
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000)
      const key = d.toISOString().slice(0, 10)
      const rnd = seeded('tl' + key)
      const dayTx = db.transactions.filter(t => t.timestamp.slice(0, 10) === key)
      data.push({
        date: key,
        ok: Math.floor(rnd() * 40 + 30) + dayTx.filter(t => t.status === 'OK').length,
        verify: Math.floor(rnd() * 12 + 4) + dayTx.filter(t => t.status === 'VERIFY').length,
        block: Math.floor(rnd() * 6 + 1) + dayTx.filter(t => t.status === 'BLOCK').length,
        verifiedByUser: Math.floor(rnd() * 8 + 2) + dayTx.filter(t => t.status === 'VERIFIED_BY_USER').length,
      })
    }
    return { data }
  }
  if (method === 'GET' && p === '/ai/stats/distribution') {
    const buckets = [
      { label: '0-20', base: 480 }, { label: '20-40', base: 260 },
      { label: '40-60', base: 130 }, { label: '60-80', base: 58 },
      { label: '80-100', base: 24 },
    ].map(({ label, base }) => {
      const [lo, hi] = label.split('-').map(Number)
      const real = db.transactions.filter(t => t.riskScore >= lo && t.riskScore < (hi === 100 ? 101 : hi)).length
      return { label, count: base + real }
    })
    return { buckets }
  }
  if (method === 'GET' && p === '/ai/model-info') {
    return {
      status: 'READY',
      lastRetrainAt: db.model.lastRetrainAt,
      transactionsSinceRetrain: db.model.transactionsSinceRetrain,
      feedbackAvailable: {
        verifiedByUser: db.transactions.filter(t => t.status === 'VERIFIED_BY_USER').length + 41,
        blocked: db.transactions.filter(t => t.status === 'BLOCK').length + 17,
        pendingVerify: db.transactions.filter(t => t.status === 'VERIFY').length,
      },
    }
  }
  if (method === 'GET' && p === '/ai/health') {
    return { aiService: { online: false, mode: 'simulation' } }
  }
  if (method === 'POST' && p === '/ml/retrain') {
    db.model.lastRetrainAt = new Date().toISOString()
    db.model.transactionsSinceRetrain = 0
    save()
    emitLater('ai:stats-updated', aiStats(), 2500)
    return { message: 'Ré-entraînement du modèle lancé (simulation). Nouveau modèle actif dans quelques secondes.' }
  }

  throw httpError(404, `Endpoint simulé introuvable : ${method} ${p}`)
}

function aiStats() {
  const real = db.transactions
  const byStatus = { OK: 812, VERIFY: 96, BLOCK: 74, VERIFIED_BY_USER: 258 }
  real.forEach(t => { if (byStatus[t.status] !== undefined) byStatus[t.status] += 1 })
  const total = Object.values(byStatus).reduce((a, b) => a + b, 0)
  const today = new Date().toISOString().slice(0, 10)
  return {
    totalTransactions: total,
    todayCount: 34 + real.filter(t => t.timestamp.slice(0, 10) === today).length,
    averageRiskScore: 31.6,
    blockRate: byStatus.BLOCK / total,
    falsePositiveRate: 0.027,
    aiResponseTime: { avgMs: 148 },
    byStatus,
  }
}
