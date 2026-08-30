import { useState, useEffect } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { api } from '../lib/api'
import StatusBadge from '../components/StatusBadge'

export default function TransactionDetail() {
  const { id } = useParams()
  const { user, isAuthenticated } = useAuth()
  const [tx, setTx] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [disputing, setDisputing] = useState(false)
  const [disputeMsg, setDisputeMsg] = useState('')
  const [trace, setTrace] = useState(null)
  const [traceOpen, setTraceOpen] = useState(false)

  useEffect(() => {
    api.get(`/transactions/${id}`)
      .then(setTx)
      .catch(() => setError('Transaction introuvable'))
      .finally(() => setLoading(false))
  }, [id])

  if (!isAuthenticated) return <Navigate to="/connexion" replace />

  const riskColor = (s) => s < 30 ? 'var(--green)' : s < 60 ? 'var(--orange)' : '#e53e3e'

  const handleDispute = async () => {
    if (!confirm('Signaler cette transaction comme frauduleuse ? Votre application sera gelée par mesure de sécurité.')) return
    setDisputing(true)
    try {
      const res = await api.post('/disputes', {
        transactionId: tx.id,
        userId: user.id,
        reason: 'Transaction non autorisée',
        description: `Signalement de la transaction #${tx.numero}`,
      })
      setDisputeMsg(res.message || 'Signalement enregistré.')
    } catch (err) {
      setDisputeMsg(err.body?.message || 'Erreur lors du signalement.')
    }
    setDisputing(false)
  }

  if (loading) return <section style={{padding:'160px 40px',minHeight:'100vh',background:'#FAFBFF'}}><p style={{textAlign:'center',color:'var(--blue-2)'}}>Chargement...</p></section>
  if (error) return <section style={{padding:'160px 40px',minHeight:'100vh',background:'#FAFBFF'}}><p style={{textAlign:'center',color:'#e53e3e'}}>{error}</p></section>

  return (
    <section className="app-page">
      <div style={{maxWidth:900,margin:'0 auto'}}>
        <Link to="/mes-transactions" style={{fontSize:'.8rem',color:'var(--orange)',textDecoration:'none',display:'inline-block',marginBottom:24}}>
          ← Retour aux transactions
        </Link>

        <div className="tx-detail-card">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:16,marginBottom:24}}>
            <div>
              <span style={{fontFamily:"'SF Mono','Segoe UI Mono','Roboto Mono',monospace",fontSize:'.7rem',color:'var(--blue-2)'}}>Transaction #{tx.numero}</span>
              <h2 style={{fontFamily:"var(--font-head)",fontWeight:900,fontSize:'2rem',color:'var(--blue)',marginTop:4}}>
                {tx.amount} <span style={{fontSize:'1rem',color:'var(--blue-2)'}}>{tx.devise}</span>
              </h2>
            </div>
            <StatusBadge status={tx.status} />
          </div>

          {/* Risk score */}
          <div style={{marginBottom:28}}>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:'.75rem',color:'var(--blue-2)',marginBottom:6}}>
              <span>Score de risque</span><span style={{fontWeight:700,color:riskColor(tx.riskScore)}}>{tx.riskScore}/100</span>
            </div>
            <div className="risk-bar" style={{height:8,borderRadius:4}}>
              <div className="risk-fill" style={{width:`${tx.riskScore}%`,background:riskColor(tx.riskScore),height:8,borderRadius:4}}/>
            </div>
          </div>

          {/* Reasons — explication claire */}
          {tx.reasons?.length > 0 && (
            <div style={{
              marginBottom:24,padding:'16px 20px',borderRadius:14,
              background: tx.status === 'BLOCK' || tx.status === 'FRAUD_CONFIRMED' ? 'rgba(229,62,62,.06)' : tx.status === 'VERIFY' ? 'rgba(238,146,33,.06)' : 'rgba(56,142,60,.04)',
              border: `1px solid ${tx.status === 'BLOCK' || tx.status === 'FRAUD_CONFIRMED' ? 'rgba(229,62,62,.15)' : tx.status === 'VERIFY' ? 'rgba(238,146,33,.15)' : 'rgba(56,142,60,.1)'}`,
            }}>
              <p style={{fontWeight:700,fontSize:'.85rem',marginBottom:8,color: tx.status === 'BLOCK' || tx.status === 'FRAUD_CONFIRMED' ? '#e53e3e' : tx.status === 'VERIFY' ? 'var(--orange)' : 'var(--green)'}}>
                {tx.status === 'BLOCK' || tx.status === 'FRAUD_CONFIRMED'
                  ? 'Cette transaction a ete bloquee pour les motifs suivants :'
                  : tx.status === 'VERIFY'
                    ? 'Cette transaction a ete signalee pour verification :'
                    : 'Details de l\'analyse :'}
              </p>
              <ul style={{listStyle:'none',margin:0,padding:0,display:'flex',flexDirection:'column',gap:4}}>
                {tx.reasons.map((r, i) => (
                  <li key={i} style={{fontSize:'.82rem',color:'var(--blue)',paddingLeft:18,position:'relative',lineHeight:1.5}}>
                    <span style={{position:'absolute',left:0,color: tx.status === 'BLOCK' ? '#e53e3e' : 'var(--orange)'}}>•</span>{r}
                  </li>
                ))}
              </ul>
              {tx.requiresManualReview && (
                <p style={{fontSize:'.75rem',color:'var(--blue-2)',marginTop:10,fontStyle:'italic'}}>
                  Cette transaction sera egalement examinee par un agent bancaire.
                </p>
              )}
            </div>
          )}

          {/* Details grid */}
          <div className="tx-detail-grid">
            <div className="tx-detail-item"><span className="tx-detail-label">Type</span><span>{tx.typeTransaction}</span></div>
            <div className="tx-detail-item"><span className="tx-detail-label">Canal</span><span>{tx.canalTransaction}</span></div>
            <div className="tx-detail-item"><span className="tx-detail-label">Appareil</span><span>{tx.typeAppareil}</span></div>
            <div className="tx-detail-item"><span className="tx-detail-label">Réseau</span><span>{tx.typeReseau}</span></div>
            <div className="tx-detail-item"><span className="tx-detail-label">Ville origine</span><span>{tx.villeOrigine || '—'}</span></div>
            <div className="tx-detail-item"><span className="tx-detail-label">Ville destination</span><span>{tx.villeDestination || '—'}</span></div>
            <div className="tx-detail-item"><span className="tx-detail-label">Nouvel appareil</span><span>{tx.nouvelAppareil ? 'Oui' : 'Non'}</span></div>
            <div className="tx-detail-item"><span className="tx-detail-label">Nouvelle localisation</span><span>{tx.nouvelleLocalisation ? 'Oui' : 'Non'}</span></div>
            <div className="tx-detail-item"><span className="tx-detail-label">Tx en 1h</span><span>{tx.nbTransactions1h}</span></div>
            <div className="tx-detail-item"><span className="tx-detail-label">Tx en 24h</span><span>{tx.nbTransactions24h}</span></div>
            <div className="tx-detail-item"><span className="tx-detail-label">Temps IA</span><span>{tx.aiResponseTimeMs}ms</span></div>
            <div className="tx-detail-item"><span className="tx-detail-label">Date</span><span>{new Date(tx.timestamp).toLocaleString('fr-FR')}</span></div>
          </div>

          {/* Tracability */}
          <div style={{marginTop:24}}>
            <button onClick={async () => {
              if (trace) { setTraceOpen(!traceOpen); return }
              try { const t = await api.get(`/transactions/${id}/trace`); setTrace(t); setTraceOpen(true) }
              catch { setTrace({ error: true }) ; setTraceOpen(true) }
            }} className="btn-outline" style={{fontSize:'.78rem',padding:'8px 16px'}}>
              {traceOpen ? 'Masquer la tracabilite' : 'Voir la tracabilite complete'}
            </button>
            {traceOpen && trace && !trace.error && (
              <div className="tx-detail-grid" style={{marginTop:16}}>
                {trace.trace?.ipAddress && <div className="tx-detail-item"><span className="tx-detail-label">Adresse IP</span><span>{trace.trace.ipAddress}</span></div>}
                {trace.trace?.deviceFingerprint && <div className="tx-detail-item"><span className="tx-detail-label">Empreinte appareil</span><span style={{fontSize:'.7rem',wordBreak:'break-all'}}>{trace.trace.deviceFingerprint}</span></div>}
                {trace.trace?.userAgent && <div className="tx-detail-item" style={{gridColumn:'1/-1'}}><span className="tx-detail-label">User Agent</span><span style={{fontSize:'.7rem',wordBreak:'break-all'}}>{trace.trace.userAgent}</span></div>}
                {trace.userHistory?.knownDevices?.length > 0 && <div className="tx-detail-item"><span className="tx-detail-label">Appareils connus</span><span>{trace.userHistory.knownDevices.length}</span></div>}
                {trace.userHistory?.knownIPs?.length > 0 && <div className="tx-detail-item"><span className="tx-detail-label">IPs connues</span><span>{trace.userHistory.knownIPs.length}</span></div>}
                {trace.disputes?.length > 0 && <div className="tx-detail-item"><span className="tx-detail-label">Signalements lies</span><span>{trace.disputes.length}</span></div>}
              </div>
            )}
            {traceOpen && trace?.error && <p style={{fontSize:'.8rem',color:'var(--blue-2)',marginTop:8}}>Tracabilite non disponible</p>}
          </div>

          {/* Dispute */}
          {disputeMsg ? (
            <div style={{marginTop:24,padding:'16px 20px',borderRadius:12,background:'rgba(238,146,33,.08)',border:'1px solid rgba(238,146,33,.2)',fontSize:'.85rem',color:'var(--blue)'}}>
              {disputeMsg}
            </div>
          ) : (
            <button onClick={handleDispute} disabled={disputing}
              style={{marginTop:24,background:'none',border:'1px solid #e53e3e',color:'#e53e3e',padding:'10px 24px',borderRadius:99,fontSize:'.8rem',fontWeight:600,cursor:'pointer',transition:'all .2s'}}>
              {disputing ? 'Signalement...' : 'Signaler une fraude'}
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
