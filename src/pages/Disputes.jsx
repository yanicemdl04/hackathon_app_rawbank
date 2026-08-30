import { useState, useEffect, useCallback } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { api } from '../lib/api'
import { toast } from 'sonner'

const STATUS_LABELS = {
  OPEN: { label: 'Ouvert', color: 'var(--orange)' },
  INVESTIGATING: { label: 'En cours', color: '#3b82f6' },
  CONFIRMED: { label: 'Confirme', color: '#e53e3e' },
  REJECTED: { label: 'Rejete', color: 'var(--blue-2)' },
  RESOLVED: { label: 'Resolu', color: 'var(--green)' },
}

export default function Disputes() {
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [pagination, setPagination] = useState({})
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [selectedDispute, setSelectedDispute] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [updating, setUpdating] = useState(false)

  const TRANSITIONS = {
    OPEN: ['INVESTIGATING', 'REJECTED'],
    INVESTIGATING: ['CONFIRMED', 'REJECTED'],
    CONFIRMED: ['RESOLVED'],
  }

  const openDetail = async (id) => {
    setDetailLoading(true)
    try {
      const d = await api.get(`/disputes/${id}`)
      setSelectedDispute(d)
    } catch { toast.error('Impossible de charger le detail') }
    setDetailLoading(false)
  }

  const updateStatus = async (disputeId, newStatus) => {
    setUpdating(true)
    try {
      await api.patch(`/disputes/${disputeId}`, { status: newStatus, resolution: `Mis a jour vers ${newStatus}` })
      toast.success(`Statut mis a jour → ${STATUS_LABELS[newStatus]?.label || newStatus}`)
      setSelectedDispute(null)
      fetchDisputes()
    } catch (err) { toast.error(err.body?.message || 'Erreur de mise a jour') }
    setUpdating(false)
  }

  const fetchDisputes = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, pageSize: 15, userId: user.id })
      if (statusFilter) params.set('status', statusFilter)
      const data = await api.get(`/disputes?${params}`)
      setItems(data.items || data.disputes || [])
      setPagination(data.pagination || {})
    } catch {}
    setLoading(false)
  }, [user, page, statusFilter])

  useEffect(() => { fetchDisputes() }, [fetchDisputes])

  useEffect(() => {
    api.get('/disputes/stats').then(setStats).catch(() => {})
  }, [])

  if (!isAuthenticated) return <Navigate to="/connexion" replace />

  return (
    <section className="app-page">
      <div style={{maxWidth:1100,margin:'0 auto'}}>
        <div style={{marginBottom:36}}>
          <span className="section-tag">Signalements</span>
          <h2 className="section-h2">Mes <em>signalements</em> de fraude</h2>
          <p style={{fontSize:'.85rem',color:'var(--blue-2)'}}>Suivez l'etat de vos signalements de transactions frauduleuses.</p>
        </div>

        {/* Stats summary */}
        {stats && (
          <div className="ai-kpi-row" style={{marginBottom:28}}>
            {Object.entries(STATUS_LABELS).map(([key, { label, color }]) => (
              <div className="ai-kpi-card" key={key}>
                <div className="ai-kpi-val" style={{color}}>{stats[key] ?? stats[key.toLowerCase()] ?? 0}</div>
                <div className="ai-kpi-label">{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Filter */}
        <div style={{display:'flex',justifyContent:'flex-end',marginBottom:16}}>
          <select className="contact-select" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
            style={{width:'auto',minWidth:160,marginBottom:0}}>
            <option value="">Tous les statuts</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="tx-skeleton">{[...Array(3)].map((_, i) => <div key={i} className="tx-skeleton-row" />)}</div>
        ) : items.length === 0 ? (
          <div className="tx-empty"><p style={{color:'var(--blue-2)'}}>Aucun signalement</p></div>
        ) : (
          <div className="dispute-list">
            {items.map(d => {
              const st = STATUS_LABELS[d.status] || { label: d.status, color: 'var(--blue-2)' }
              return (
                <div key={d.id} className="dispute-card" onClick={() => openDetail(d.id)}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                    <span style={{fontFamily:"'SF Mono','Segoe UI Mono','Roboto Mono',monospace",fontSize:'.7rem',color:'var(--blue-2)'}}>#{d.id?.slice(0, 8)}</span>
                    <span className="status-badge" style={{background:`${st.color}15`,color:st.color}}>{st.label}</span>
                  </div>
                  <div style={{fontWeight:600,fontSize:'.9rem',color:'var(--blue)',marginBottom:4}}>{d.reason || 'Signalement de fraude'}</div>
                  {d.description && <p style={{fontSize:'.8rem',color:'var(--blue-2)',marginBottom:6}}>{d.description}</p>}
                  {d.resolution && <p style={{fontSize:'.78rem',color:'var(--green)',fontStyle:'italic'}}>{d.resolution}</p>}
                  <div style={{fontSize:'.7rem',color:'var(--blue-2)',marginTop:6}}>
                    {d.createdAt ? new Date(d.createdAt).toLocaleString('fr-FR') : ''}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div style={{display:'flex',justifyContent:'center',gap:12,marginTop:24}}>
            <button className="btn-outline" disabled={!pagination.hasPrev} onClick={() => setPage(p => p - 1)} style={{fontSize:'.8rem',padding:'8px 16px'}}>← Precedent</button>
            <span style={{alignSelf:'center',fontSize:'.8rem',color:'var(--blue-2)'}}>Page {pagination.page} / {pagination.totalPages}</span>
            <button className="btn-outline" disabled={!pagination.hasNext} onClick={() => setPage(p => p + 1)} style={{fontSize:'.8rem',padding:'8px 16px'}}>Suivant →</button>
          </div>
        )}
      </div>

      {/* Dispute detail modal */}
      {(selectedDispute || detailLoading) && (
        <div className="modal-backdrop" onClick={() => !updating && setSelectedDispute(null)}>
          <div className="modal-glass" style={{maxWidth:500,textAlign:'left'}} onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedDispute(null)}>&times;</button>
            {detailLoading ? (
              <p style={{textAlign:'center',color:'var(--blue-2)',padding:20}}>Chargement...</p>
            ) : selectedDispute && (() => {
              const st = STATUS_LABELS[selectedDispute.status] || { label: selectedDispute.status, color: 'var(--blue-2)' }
              const actions = TRANSITIONS[selectedDispute.status] || []
              return (
                <>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                    <span style={{fontFamily:"'SF Mono','Segoe UI Mono','Roboto Mono',monospace",fontSize:'.7rem',color:'var(--blue-2)'}}>#{selectedDispute.id?.slice(0,8)}</span>
                    <span className="status-badge" style={{background:`${st.color}15`,color:st.color}}>{st.label}</span>
                  </div>
                  <h3 style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:'1.1rem',color:'var(--blue)',marginBottom:8}}>
                    {selectedDispute.reason || 'Signalement de fraude'}
                  </h3>
                  {selectedDispute.description && <p style={{fontSize:'.82rem',color:'var(--blue-2)',marginBottom:12}}>{selectedDispute.description}</p>}
                  {selectedDispute.resolution && <p style={{fontSize:'.82rem',color:'var(--green)',fontStyle:'italic',marginBottom:12}}>{selectedDispute.resolution}</p>}
                  <div className="tx-detail-grid" style={{marginBottom:16}}>
                    <div className="tx-detail-item"><span className="tx-detail-label">Date</span><span>{selectedDispute.createdAt ? new Date(selectedDispute.createdAt).toLocaleString('fr-FR') : '—'}</span></div>
                    {selectedDispute.transactionId && <div className="tx-detail-item"><span className="tx-detail-label">Transaction</span><span style={{fontSize:'.7rem'}}>{selectedDispute.transactionId.slice(0,12)}...</span></div>}
                  </div>
                  {selectedDispute.transactionId && (
                    <button onClick={() => { setSelectedDispute(null); navigate(`/transactions/${selectedDispute.transactionId}`) }}
                      className="btn-outline" style={{fontSize:'.78rem',padding:'8px 16px',marginBottom:12,width:'100%'}}>
                      Voir la transaction
                    </button>
                  )}
                  {actions.length > 0 && (
                    <div style={{borderTop:'1px solid rgba(224,224,224,.3)',paddingTop:16}}>
                      <p style={{fontSize:'.72rem',color:'var(--blue-2)',marginBottom:8,fontWeight:600,textTransform:'uppercase',letterSpacing:'.04em'}}>Actions</p>
                      <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                        {actions.map(a => {
                          const aStyle = STATUS_LABELS[a] || {}
                          return (
                            <button key={a} onClick={() => updateStatus(selectedDispute.id, a)} disabled={updating}
                              className="btn-outline" style={{fontSize:'.78rem',padding:'8px 16px',borderColor:aStyle.color,color:aStyle.color}}>
                              {updating ? '...' : `→ ${aStyle.label || a}`}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </>
              )
            })()}
          </div>
        </div>
      )}
    </section>
  )
}
