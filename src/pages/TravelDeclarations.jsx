import { useState, useEffect, useCallback } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { api } from '../lib/api'
import { toast } from 'sonner'

export default function TravelDeclarations() {
  const { user, isAuthenticated } = useAuth()
  const [active, setActive] = useState([])
  const [history, setHistory] = useState([])
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    destination: '', pays: '', locationCode: 'PARIS',
    startDate: '', endDate: '',
  })

  const fetchData = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const [a, h, l] = await Promise.all([
        api.get(`/users/${user.id}/travel/active`).catch(() => ({ declarations: [] })),
        api.get(`/users/${user.id}/travel`).catch(() => ({ declarations: [] })),
        api.get('/locations').catch(() => ({ locations: [] })),
      ])
      setActive(a.declarations || [])
      setHistory(h.declarations || h || [])
      setLocations(l.locations || [])
    } catch {}
    setLoading(false)
  }, [user])

  useEffect(() => { fetchData() }, [fetchData])

  if (!isAuthenticated) return <Navigate to="/connexion" replace />

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleLocationChange = (code) => {
    const loc = locations.find(l => l.code === code)
    set('locationCode', code)
    if (loc) { set('destination', loc.ville); set('pays', loc.pays) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.destination || !form.startDate || !form.endDate) return toast.error('Remplissez tous les champs')
    const loc = locations.find(l => l.code === form.locationCode) || {}
    setSubmitting(true)
    try {
      await api.post(`/users/${user.id}/declare-travel`, {
        destination: form.destination,
        pays: form.pays || loc.pays || '',
        latitude: loc.latitude || 0,
        longitude: loc.longitude || 0,
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
      })
      toast.success(`Voyage declare vers ${form.destination}`)
      setForm({ destination: '', pays: '', locationCode: 'PARIS', startDate: '', endDate: '' })
      fetchData()
    } catch (err) {
      toast.error(err.body?.message || 'Erreur lors de la declaration')
    }
    setSubmitting(false)
  }

  const cancelTravel = async (declId) => {
    try {
      await api.post(`/users/${user.id}/travel/${declId}/cancel`, {})
      toast.success('Voyage annule')
      fetchData()
    } catch (err) {
      toast.error(err.body?.message || 'Erreur')
    }
  }

  return (
    <section className="app-page">
      <div style={{maxWidth:900,margin:'0 auto'}}>
        <div style={{marginBottom:36}}>
          <span className="section-tag">Voyages</span>
          <h2 className="section-h2">Declarations de <em>voyage</em></h2>
          <p style={{fontSize:'.85rem',color:'var(--blue-2)'}}>
            Declarez vos voyages pour eviter le blocage de vos transactions a l'etranger.
          </p>
        </div>

        {/* Active travels */}
        {active.length > 0 && (
          <div style={{marginBottom:32}}>
            <h3 style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:'1rem',color:'var(--blue)',marginBottom:12}}>
              Voyages actifs
            </h3>
            <div className="dispute-list">
              {active.map(d => (
                <div key={d.id} className="dispute-card" style={{cursor:'default'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <div>
                      <div style={{fontWeight:600,color:'var(--blue)'}}>
                        {d.destination}{d.pays ? `, ${d.pays}` : ''}
                      </div>
                      <div style={{fontSize:'.78rem',color:'var(--blue-2)',marginTop:4}}>
                        {new Date(d.startDate).toLocaleDateString('fr-FR')} → {new Date(d.endDate).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                    <button onClick={() => cancelTravel(d.id)} className="btn-outline" style={{fontSize:'.75rem',padding:'6px 14px',borderColor:'#e53e3e',color:'#e53e3e'}}>
                      Annuler
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Declare form */}
        <div className="auth-card" style={{maxWidth:'100%',marginBottom:32}}>
          <h3 style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:'1.1rem',color:'var(--blue)',marginBottom:16}}>
            Declarer un nouveau voyage
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label className="auth-label">Destination</label>
                <select className="contact-select" value={form.locationCode} onChange={e => handleLocationChange(e.target.value)}>
                  {locations.map(l => <option key={l.code} value={l.code}>{l.ville}, {l.pays}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="auth-label">Destination (nom)</label>
                <input className="contact-input" type="text" value={form.destination} onChange={e => set('destination', e.target.value)} placeholder="Paris" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="auth-label">Date de depart</label>
                <input className="contact-input" type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="auth-label">Date de retour</label>
                <input className="contact-input" type="date" value={form.endDate} onChange={e => set('endDate', e.target.value)} required />
              </div>
            </div>
            <button type="submit" className="btn-primary" disabled={submitting} style={{width:'100%',padding:'14px',fontSize:'.9rem',marginTop:8}}>
              {submitting ? 'Declaration en cours...' : 'Declarer le voyage'}
            </button>
          </form>
        </div>

        {/* History */}
        <div>
          <h3 style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:'1rem',color:'var(--blue)',marginBottom:12}}>
            Historique
          </h3>
          {loading ? (
            <div className="tx-skeleton">{[...Array(3)].map((_, i) => <div key={i} className="tx-skeleton-row" />)}</div>
          ) : (Array.isArray(history) && history.length > 0) ? (
            <div className="dispute-list">
              {history.map(d => (
                <div key={d.id} className="dispute-card" style={{cursor:'default',opacity: d.active ? 1 : .6}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <div>
                      <div style={{fontWeight:600,color:'var(--blue)',fontSize:'.9rem'}}>
                        {d.destination}{d.pays ? `, ${d.pays}` : ''}
                      </div>
                      <div style={{fontSize:'.75rem',color:'var(--blue-2)',marginTop:2}}>
                        {new Date(d.startDate).toLocaleDateString('fr-FR')} → {new Date(d.endDate).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                    <span className="status-badge" style={{background: d.active ? 'rgba(56,142,60,.1)' : 'rgba(224,224,224,.3)', color: d.active ? 'var(--green)' : 'var(--blue-2)'}}>
                      {d.active ? 'Actif' : 'Termine'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="tx-empty"><p style={{color:'var(--blue-2)'}}>Aucun voyage declare</p></div>
          )}
        </div>
      </div>
    </section>
  )
}
