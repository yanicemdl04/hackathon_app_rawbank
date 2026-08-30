import { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link, Navigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { api } from '../lib/api'
import { getSocket } from '../lib/socket'
import StatusBadge from '../components/StatusBadge'

export default function Transactions() {
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, hasNext: false, hasPrev: false })
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const fetchTx = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, pageSize: 15, userId: user.id })
      if (status) params.set('status', status)
      const data = await api.get(`/transactions?${params}`)
      setItems(data.items || [])
      setPagination(data.pagination || {})
    } catch { /* silent */ }
    setLoading(false)
  }, [user, page, status])

  useEffect(() => { fetchTx() }, [fetchTx])

  useEffect(() => {
    if (!user) return
    const socket = getSocket()
    const refresh = () => fetchTx()
    socket.on('transaction:scored', refresh)
    socket.on('transaction:verified', refresh)
    return () => { socket.off('transaction:scored', refresh); socket.off('transaction:verified', refresh) }
  }, [user, fetchTx])

  if (!isAuthenticated) return <Navigate to="/connexion" replace />

  const riskColor = (score) => score < 30 ? 'var(--green)' : score < 60 ? 'var(--orange)' : '#e53e3e'

  return (
    <section className="app-page">
      <div style={{maxWidth:1200,margin:'0 auto'}}>
        {/* User profile card */}
        <div className="tx-profile-card">
          <div style={{flex:1}}>
            <h2 style={{fontFamily:"var(--font-head)",fontWeight:900,fontSize:'1.4rem',color:'var(--blue)',marginBottom:4}}>
              {user.name || 'Utilisateur'}
            </h2>
            <p style={{fontSize:'.8rem',color:'var(--blue-2)'}}>{user.email} · {user.phoneNumber}</p>
            <div style={{display:'flex',alignItems:'center',gap:12,marginTop:12}}>
              <span className="status-badge status-ok" style={{fontSize:'.7rem'}}>{user.accountType}</span>
              <div style={{flex:1,maxWidth:200}}>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:'.65rem',color:'var(--blue-2)',marginBottom:3}}>
                  <span>Score de risque</span><span>{user.riskScore}/100</span>
                </div>
                <div className="risk-bar"><div className="risk-fill" style={{width:`${user.riskScore}%`,background:riskColor(user.riskScore)}}/></div>
              </div>
            </div>
          </div>
          <Link to="/nouvelle-transaction" className="btn-primary" style={{textDecoration:'none',whiteSpace:'nowrap'}}>
            + Nouvelle transaction
          </Link>
        </div>

        {/* Filters + table */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',margin:'32px 0 16px',flexWrap:'wrap',gap:12}}>
          <h3 style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:'1.1rem',color:'var(--blue)'}}>
            Mes transactions
          </h3>
          <select className="contact-select" value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}
            style={{width:'auto',minWidth:160,marginBottom:0}}>
            <option value="">Tous les statuts</option>
            <option value="OK">Approuvées</option>
            <option value="VERIFY">À vérifier</option>
            <option value="VERIFIED_BY_USER">Vérifiées</option>
            <option value="BLOCK">Bloquées</option>
          </select>
        </div>

        {loading ? (
          <div className="tx-skeleton">
            {[...Array(5)].map((_, i) => <div key={i} className="tx-skeleton-row" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="tx-empty">
            <p style={{color:'var(--blue-2)',fontSize:'.9rem'}}>Aucune transaction trouvée</p>
            <Link to="/nouvelle-transaction" className="btn-primary" style={{textDecoration:'none',marginTop:16,display:'inline-block'}}>
              Créer une transaction
            </Link>
          </div>
        ) : (
          <div className="tx-table-wrap">
            <table className="tx-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Montant</th>
                  <th>Type</th>
                  <th>Statut</th>
                  <th>Risque</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {items.map(tx => (
                  <tr key={tx.id} onClick={() => navigate(`/transactions/${tx.id}`)} className="tx-row">
                    <td style={{fontFamily:"'SF Mono','Segoe UI Mono','Roboto Mono',monospace",fontSize:'.8rem'}}>{tx.numero}</td>
                    <td style={{fontWeight:600}}>{tx.amount} {tx.devise}</td>
                    <td style={{fontSize:'.8rem',color:'var(--blue-2)'}}>{tx.typeTransaction}</td>
                    <td><StatusBadge status={tx.status} /></td>
                    <td>
                      <div className="risk-bar" style={{width:60}}>
                        <div className="risk-fill" style={{width:`${tx.riskScore}%`,background:riskColor(tx.riskScore)}}/>
                      </div>
                      <span style={{fontSize:'.65rem',color:'var(--blue-2)'}}>{tx.riskScore}</span>
                    </td>
                    <td style={{fontSize:'.75rem',color:'var(--blue-2)'}}>{new Date(tx.timestamp).toLocaleDateString('fr-FR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div style={{display:'flex',justifyContent:'center',gap:12,marginTop:24}}>
            <button className="btn-outline" disabled={!pagination.hasPrev} onClick={() => setPage(p => p - 1)}
              style={{fontSize:'.8rem',padding:'8px 16px'}}>← Précédent</button>
            <span style={{alignSelf:'center',fontSize:'.8rem',color:'var(--blue-2)'}}>
              Page {pagination.page} / {pagination.totalPages}
            </span>
            <button className="btn-outline" disabled={!pagination.hasNext} onClick={() => setPage(p => p + 1)}
              style={{fontSize:'.8rem',padding:'8px 16px'}}>Suivant →</button>
          </div>
        )}
      </div>
    </section>
  )
}
