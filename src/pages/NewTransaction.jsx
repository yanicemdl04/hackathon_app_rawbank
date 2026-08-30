import { useState, useEffect, useCallback } from 'react'
import { Navigate, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { api } from '../lib/api'
import StatusBadge from '../components/StatusBadge'
import OtpModal from '../components/OtpModal'
import { toast } from 'sonner'

const TYPES_TX = ['TRANSFERT', 'RETRAIT', 'DEPOT', 'PAIEMENT']
const CANAUX = ['MOBILE', 'USSD', 'WEB', 'POS', 'GAB', 'AGENCE']
const APPAREILS = ['ANDROID', 'IOS', 'WEB', 'FEATURE_PHONE']
const RESEAUX = ['G2', 'G3', 'G4', 'WIFI']
const DEVISES = ['USD', 'CDF']

export default function NewTransaction() {
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [locations, setLocations] = useState([])
  const [form, setForm] = useState({
    amount: '', devise: 'USD', typeTransaction: 'TRANSFERT', canalTransaction: 'MOBILE',
    typeAppareil: 'ANDROID', typeReseau: 'G4', locationCode: 'KINSHASA',
    nouvelAppareil: false, nouvelleLocalisation: false, transactionInternationale: false,
    montantMoyenClient: 150, nbTransactions1h: 2, nbTransactions24h: 5, ratioEcartMontant: 1.5,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [simulating, setSimulating] = useState(false)
  const [simMsg, setSimMsg] = useState('')
  const [otpVisible, setOtpVisible] = useState(false)
  const [otpSentTo, setOtpSentTo] = useState('')
  const [txId, setTxId] = useState('')
  const [otpError, setOtpError] = useState('')
  const [otpLoading, setOtpLoading] = useState(false)

  useEffect(() => {
    api.get('/locations').then(d => setLocations(d.locations || [])).catch(() => {})
  }, [])

  if (!isAuthenticated) return <Navigate to="/connexion" replace />

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.amount || Number(form.amount) <= 0) return setError('Montant requis')
    setError(''); setLoading(true); setResult(null)
    const loc = locations.find(l => l.code === form.locationCode) || {}
    try {
      const res = await api.post('/transactions', {
        userId: user.id,
        accountType: user.accountType,
        amount: Number(form.amount),
        devise: form.devise,
        typeTransaction: form.typeTransaction,
        canalTransaction: form.canalTransaction,
        montantMoyenClient: Number(form.montantMoyenClient),
        transactionInternationale: form.transactionInternationale,
        latitude: loc.latitude || -4.325,
        longitude: loc.longitude || 15.322,
        paysDestination: loc.pays || 'RDC',
        villeOrigine: loc.ville || 'Kinshasa',
        villeDestination: loc.ville || 'Kinshasa',
        typeAppareil: form.typeAppareil,
        typeReseau: form.typeReseau,
        nouvelAppareil: form.nouvelAppareil,
        nouvelleLocalisation: form.nouvelleLocalisation,
        nbTransactions1h: Number(form.nbTransactions1h),
        nbTransactions24h: Number(form.nbTransactions24h),
        ratioEcartMontant: Number(form.ratioEcartMontant),
      })
      if (res.requiresOtp) {
        setTxId(res.transactionId)
        setOtpSentTo(res.otpSentTo)
        setOtpVisible(true)
      } else {
        setResult(res)
      }
    } catch (err) {
      setError(err.body?.message || 'Erreur lors de la création')
    }
    setLoading(false)
  }

  const handleVerifyTxOtp = useCallback(async (code) => {
    setOtpError(''); setOtpLoading(true)
    try {
      const res = await api.post(`/transactions/${txId}/verify-otp`, { userId: user.id, code })
      setOtpVisible(false)
      setResult({ ...res, status: res.status || 'VERIFIED_BY_USER' })
    } catch (err) {
      const b = err.body || {}
      if (err.status === 403) { setOtpVisible(false); setResult({ status: 'BLOCK', message: b.message }) }
      else if (err.status === 410) { setOtpVisible(false); setError(b.message || 'Code expiré.') }
      else setOtpError(b.message || 'Code incorrect')
    }
    setOtpLoading(false)
  }, [txId, user])

  return (
    <section className="app-page">
      <div style={{maxWidth:700,margin:'0 auto'}}>
        <Link to="/mes-transactions" style={{fontSize:'.8rem',color:'var(--orange)',textDecoration:'none',display:'inline-block',marginBottom:24}}>
          ← Retour aux transactions
        </Link>

        <div className="auth-card" style={{maxWidth:'100%'}}>
          <h2 style={{fontFamily:"var(--font-head)",fontWeight:900,fontSize:'1.4rem',color:'var(--blue)',marginBottom:4}}>
            Nouvelle transaction
          </h2>
          <p style={{fontSize:'.82rem',color:'var(--blue-2)',marginBottom:28}}>
            Simulez une transaction pour tester la détection de fraude par l'IA.
          </p>

          {result ? (
            <div className="tx-result">
              <div style={{textAlign:'center',marginBottom:20}}>
                <StatusBadge status={result.status} />
                <p style={{fontFamily:"var(--font-head)",fontWeight:900,fontSize:'2rem',color:'var(--blue)',margin:'12px 0 4px'}}>
                  Score: {result.riskScore ?? '—'}<span style={{fontSize:'.9rem',color:'var(--blue-2)'}}>/100</span>
                </p>
                {result.aiResponseTimeMs && <p style={{fontSize:'.75rem',color:'var(--blue-2)'}}>Analyse IA en {result.aiResponseTimeMs}ms</p>}
              </div>

              {/* Explication claire pour l'utilisateur */}
              {(result.status === 'BLOCK' || result.status === 'VERIFY') && (
                <div style={{
                  padding:'16px 20px',borderRadius:14,marginBottom:20,
                  background: result.status === 'BLOCK' ? 'rgba(229,62,62,.06)' : 'rgba(238,146,33,.06)',
                  border: `1px solid ${result.status === 'BLOCK' ? 'rgba(229,62,62,.15)' : 'rgba(238,146,33,.15)'}`,
                }}>
                  <p style={{fontWeight:700,fontSize:'.88rem',color: result.status === 'BLOCK' ? '#e53e3e' : 'var(--orange)',marginBottom:8}}>
                    {result.status === 'BLOCK'
                      ? 'Votre transaction a ete bloquee pour les motifs suivants :'
                      : 'Votre transaction necessite une verification supplementaire :'}
                  </p>
                  {result.reasons?.length > 0 && (
                    <ul style={{listStyle:'none',margin:0,padding:0}}>
                      {result.reasons.map((r, i) => (
                        <li key={i} style={{fontSize:'.82rem',color:'var(--blue)',padding:'5px 0',paddingLeft:18,position:'relative',lineHeight:1.5}}>
                          <span style={{position:'absolute',left:0,color: result.status === 'BLOCK' ? '#e53e3e' : 'var(--orange)'}}>•</span>{r}
                        </li>
                      ))}
                    </ul>
                  )}
                  {result.requiresManualReview && (
                    <p style={{fontSize:'.75rem',color:'var(--blue-2)',marginTop:8,fontStyle:'italic'}}>
                      Cette transaction sera egalement examinee par un agent bancaire.
                    </p>
                  )}
                </div>
              )}

              {result.status === 'OK' && result.reasons?.length > 0 && (
                <ul style={{listStyle:'none',marginBottom:20}}>
                  {result.reasons.map((r, i) => (
                    <li key={i} style={{fontSize:'.82rem',color:'var(--blue-2)',padding:'6px 0',borderBottom:'1px solid rgba(224,224,224,.4)',paddingLeft:16,position:'relative'}}>
                      <span style={{position:'absolute',left:0,color:'var(--green)'}}>•</span>{r}
                    </li>
                  ))}
                </ul>
              )}

              {result.message && <p style={{fontSize:'.85rem',color:'var(--blue)',marginBottom:16}}>{result.message}</p>}
              <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
                <button onClick={() => { setResult(null); setForm(f => ({...f, amount: ''})) }} className="btn-primary" style={{fontSize:'.8rem'}}>
                  Nouvelle transaction
                </button>
                <Link to="/mes-transactions" className="btn-outline" style={{textDecoration:'none',fontSize:'.8rem'}}>
                  Voir mes transactions
                </Link>
                {result.transactionId && (
                  <Link to={`/transactions/${result.transactionId}`} className="btn-outline" style={{textDecoration:'none',fontSize:'.8rem'}}>
                    Voir le detail
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label className="auth-label">Montant *</label>
                  <input className="contact-input" type="number" min="1" step="0.01" placeholder="500" value={form.amount}
                    onChange={e => set('amount', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="auth-label">Devise</label>
                  <select className="contact-select" value={form.devise} onChange={e => set('devise', e.target.value)}>
                    {DEVISES.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="auth-label">Type de transaction</label>
                  <select className="contact-select" value={form.typeTransaction} onChange={e => set('typeTransaction', e.target.value)}>
                    {TYPES_TX.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="auth-label">Canal</label>
                  <select className="contact-select" value={form.canalTransaction} onChange={e => set('canalTransaction', e.target.value)}>
                    {CANAUX.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="auth-label">Appareil</label>
                  <select className="contact-select" value={form.typeAppareil} onChange={e => set('typeAppareil', e.target.value)}>
                    {APPAREILS.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="auth-label">Réseau</label>
                  <select className="contact-select" value={form.typeReseau} onChange={e => set('typeReseau', e.target.value)}>
                    {RESEAUX.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>

              <label className="auth-label">Localisation</label>
              <div style={{display:'flex',gap:12,alignItems:'flex-end'}}>
                <div style={{flex:1}}>
                  <select className="contact-select" value={form.locationCode} onChange={e => set('locationCode', e.target.value)} style={{marginBottom:0}}>
                    {locations.map(l => <option key={l.code} value={l.code}>{l.ville}, {l.pays}</option>)}
                    {locations.length === 0 && <option value="KINSHASA">Kinshasa, RDC</option>}
                  </select>
                </div>
                <button type="button" disabled={simulating} onClick={async () => {
                  if (!user) return
                  setSimulating(true); setSimMsg('')
                  try {
                    const res = await api.put(`/users/${user.id}/simulate-location`, { location: form.locationCode })
                    setSimMsg(`Position mise a jour : ${res.ville}, ${res.pays}`)
                  } catch (err) { setSimMsg(err.body?.message || 'Erreur') }
                  setSimulating(false)
                }} className="btn-outline" style={{fontSize:'.75rem',padding:'10px 14px',whiteSpace:'nowrap',height:42}}>
                  {simulating ? '...' : 'Simuler ma position'}
                </button>
              </div>
              {simMsg && <p style={{fontSize:'.75rem',color:'var(--green)',marginTop:6}}>{simMsg}</p>}

              <div style={{display:'flex',gap:20,flexWrap:'wrap',margin:'16px 0'}}>
                <label className="toggle-label">
                  <input type="checkbox" checked={form.nouvelAppareil} onChange={e => set('nouvelAppareil', e.target.checked)} />
                  <span>Nouvel appareil</span>
                </label>
                <label className="toggle-label">
                  <input type="checkbox" checked={form.nouvelleLocalisation} onChange={e => set('nouvelleLocalisation', e.target.checked)} />
                  <span>Nouvelle localisation</span>
                </label>
                <label className="toggle-label">
                  <input type="checkbox" checked={form.transactionInternationale} onChange={e => set('transactionInternationale', e.target.checked)} />
                  <span>Internationale</span>
                </label>
              </div>

              {error && <p className="auth-error">{error}</p>}
              <button type="submit" className="btn-primary" disabled={loading}
                style={{width:'100%',padding:'14px',fontSize:'.9rem',marginTop:8}}>
                {loading ? 'Analyse en cours...' : 'Envoyer la transaction'}
              </button>
            </form>
          )}
        </div>
      </div>

      <OtpModal
        visible={otpVisible}
        otpSentTo={otpSentTo}
        onVerify={handleVerifyTxOtp}
        onClose={() => setOtpVisible(false)}
        onResend={async () => {
          try {
            await api.post(`/transactions/${txId}/resend-otp`, {})
            toast.success('Un nouveau code vous a été envoyé.')
          } catch { toast.error('Impossible de renvoyer le code.') }
        }}
        loading={otpLoading}
        error={otpError}
      />
    </section>
  )
}
