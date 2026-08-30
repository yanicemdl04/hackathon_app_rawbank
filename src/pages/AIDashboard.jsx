import { useState, useEffect, useCallback } from 'react'
import { Navigate } from 'react-router-dom'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, CartesianGrid, Legend } from 'recharts'
import { useAuth } from '../lib/AuthContext'
import { api } from '../lib/api'
import { getSocket } from '../lib/socket'
import { toast } from 'sonner'

const STATUS_COLORS = { OK: '#388E3C', VERIFY: '#EE9221', BLOCK: '#e53e3e', VERIFIED_BY_USER: '#3b82f6' }

export default function AIDashboard() {
  const { isAuthenticated } = useAuth()
  const [stats, setStats] = useState(null)
  const [timeline, setTimeline] = useState([])
  const [distribution, setDistribution] = useState([])
  const [modelInfo, setModelInfo] = useState(null)
  const [health, setHealth] = useState(null)
  const [retraining, setRetraining] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [s, t, d, m, h] = await Promise.all([
        api.get('/ai/stats').catch(() => null),
        api.get('/ai/stats/timeline?period=day&days=14').catch(() => ({ data: [] })),
        api.get('/ai/stats/distribution').catch(() => ({ buckets: [] })),
        api.get('/ai/model-info').catch(() => null),
        api.get('/ai/health').catch(() => null),
      ])
      setStats(s)
      setTimeline(t?.data || [])
      setDistribution(d?.buckets || [])
      setModelInfo(m)
      setHealth(h)
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  useEffect(() => {
    const socket = getSocket()
    const onStatsUpdated = (data) => {
      if (data.totalTransactions) setStats(prev => prev ? { ...prev, totalTransactions: data.totalTransactions, todayCount: data.todayCount } : prev)
    }
    socket.on('ai:stats-updated', onStatsUpdated)
    return () => socket.off('ai:stats-updated', onStatsUpdated)
  }, [])

  if (!isAuthenticated) return <Navigate to="/connexion" replace />

  const handleRetrain = async () => {
    setRetraining(true)
    try {
      const res = await api.post('/ml/retrain', { initiatedBy: 'dashboard', source: 'bouton_retrain' })
      toast.success(res.message || 'Re-entrainement lance')
      setTimeout(fetchAll, 3000)
    } catch (err) {
      toast.error(err.body?.message || 'Erreur de re-entrainement')
    }
    setRetraining(false)
  }

  const handleSeed = async () => {
    setSeeding(true)
    try {
      const res = await api.post('/users/seed-demo', {})
      toast.success(`${res.users?.length || 0} utilisateurs de demo crees`)
    } catch (err) {
      toast.error(err.body?.message || 'Erreur seed demo')
    }
    setSeeding(false)
  }

  const pieData = stats?.byStatus ? Object.entries(stats.byStatus).map(([name, value]) => ({ name, value })) : []

  return (
    <section className="app-page">
      <div style={{maxWidth:1200,margin:'0 auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:16,marginBottom:36}}>
          <div>
            <span className="section-tag">Intelligence Artificielle</span>
            <h2 className="section-h2" style={{marginBottom:4}}>Dashboard <em>IA</em></h2>
            <p style={{fontSize:'.85rem',color:'var(--blue-2)'}}>Performances du modele de detection de fraude en temps reel.</p>
          </div>
          <div style={{display:'flex',gap:12,alignItems:'center'}}>
            {health && (
              <div className={`ai-health-badge ${health.aiService?.online ? 'ai-online' : 'ai-offline'}`}>
                <span className="ai-health-dot" />
                {health.aiService?.online ? 'IA en ligne' : 'Mode simulateur'}
              </div>
            )}
            <button onClick={handleSeed} disabled={seeding} className="btn-outline" style={{fontSize:'.78rem',padding:'8px 16px'}}>
              {seeding ? 'Creation...' : 'Seed demo'}
            </button>
            <button onClick={handleRetrain} disabled={retraining} className="btn-primary" style={{fontSize:'.8rem'}}>
              {retraining ? 'Entrainement...' : 'Re-entrainer le modele'}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="tx-skeleton">{[...Array(4)].map((_, i) => <div key={i} className="tx-skeleton-row" style={{height:80}} />)}</div>
        ) : (
          <>
            {/* KPI row */}
            <div className="ai-kpi-row">
              <div className="ai-kpi-card">
                <div className="ai-kpi-val">{stats?.totalTransactions ?? '—'}</div>
                <div className="ai-kpi-label">Total transactions</div>
              </div>
              <div className="ai-kpi-card">
                <div className="ai-kpi-val">{stats?.todayCount ?? '—'}</div>
                <div className="ai-kpi-label">Aujourd'hui</div>
              </div>
              <div className="ai-kpi-card">
                <div className="ai-kpi-val" style={{color:'var(--orange)'}}>{stats?.averageRiskScore?.toFixed(1) ?? '—'}</div>
                <div className="ai-kpi-label">Score moyen</div>
              </div>
              <div className="ai-kpi-card">
                <div className="ai-kpi-val" style={{color:'#e53e3e'}}>{stats?.blockRate ? (stats.blockRate * 100).toFixed(1) + '%' : '—'}</div>
                <div className="ai-kpi-label">Taux de blocage</div>
              </div>
              <div className="ai-kpi-card">
                <div className="ai-kpi-val" style={{color:'#3b82f6'}}>{stats?.falsePositiveRate ? (stats.falsePositiveRate * 100).toFixed(1) + '%' : '—'}</div>
                <div className="ai-kpi-label">Faux positifs</div>
              </div>
              <div className="ai-kpi-card">
                <div className="ai-kpi-val">{stats?.aiResponseTime?.avgMs ?? '—'}<span style={{fontSize:'.7rem',color:'var(--blue-2)'}}>ms</span></div>
                <div className="ai-kpi-label">Temps reponse IA</div>
              </div>
            </div>

            {/* Charts row */}
            <div className="ai-charts-row">
              {/* Pie chart */}
              <div className="ai-chart-card">
                <h4 className="ai-chart-title">Repartition par statut</h4>
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {pieData.map((entry) => <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#999'} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <p className="ai-no-data">Aucune donnee</p>}
              </div>

              {/* Distribution bar chart */}
              <div className="ai-chart-card">
                <h4 className="ai-chart-title">Distribution des scores de risque</h4>
                {distribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={distribution}>
                      <XAxis dataKey="label" tick={{fontSize: 11}} />
                      <YAxis tick={{fontSize: 11}} />
                      <Tooltip />
                      <Bar dataKey="count" fill="var(--orange)" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <p className="ai-no-data">Aucune donnee</p>}
              </div>
            </div>

            {/* Timeline chart */}
            <div className="ai-chart-card" style={{marginTop:20}}>
              <h4 className="ai-chart-title">Evolution sur 14 jours</h4>
              {timeline.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={timeline}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(224,224,224,.4)" />
                    <XAxis dataKey="date" tick={{fontSize:10}} tickFormatter={d => new Date(d).toLocaleDateString('fr-FR', {day:'2-digit',month:'short'})} />
                    <YAxis tick={{fontSize:11}} />
                    <Tooltip labelFormatter={d => new Date(d).toLocaleDateString('fr-FR')} />
                    <Legend />
                    <Line type="monotone" dataKey="ok" stroke="#388E3C" strokeWidth={2} name="OK" dot={false} />
                    <Line type="monotone" dataKey="verify" stroke="#EE9221" strokeWidth={2} name="Verify" dot={false} />
                    <Line type="monotone" dataKey="block" stroke="#e53e3e" strokeWidth={2} name="Block" dot={false} />
                    <Line type="monotone" dataKey="verifiedByUser" stroke="#3b82f6" strokeWidth={2} name="Verified" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : <p className="ai-no-data">Aucune donnee</p>}
            </div>

            {/* Model info */}
            {modelInfo && (
              <div className="ai-model-card">
                <h4 className="ai-chart-title">Informations du modele</h4>
                <div className="tx-detail-grid" style={{marginTop:12}}>
                  <div className="tx-detail-item"><span className="tx-detail-label">Statut</span><span style={{color:'var(--green)',fontWeight:600}}>{modelInfo.status || '—'}</span></div>
                  <div className="tx-detail-item"><span className="tx-detail-label">Dernier entrainement</span><span>{modelInfo.lastRetrainAt ? new Date(modelInfo.lastRetrainAt).toLocaleString('fr-FR') : 'Jamais'}</span></div>
                  <div className="tx-detail-item"><span className="tx-detail-label">Tx depuis retrain</span><span>{modelInfo.transactionsSinceRetrain ?? '—'}</span></div>
                  <div className="tx-detail-item"><span className="tx-detail-label">Feedback VERIFIED</span><span>{modelInfo.feedbackAvailable?.verifiedByUser ?? '—'}</span></div>
                  <div className="tx-detail-item"><span className="tx-detail-label">Feedback BLOCKED</span><span>{modelInfo.feedbackAvailable?.blocked ?? '—'}</span></div>
                  <div className="tx-detail-item"><span className="tx-detail-label">En attente VERIFY</span><span>{modelInfo.feedbackAvailable?.pendingVerify ?? '—'}</span></div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}
