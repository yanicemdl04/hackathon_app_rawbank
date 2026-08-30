import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

export default function Login() {
  const { login, loading, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ phoneNumber: '+243', email: '', name: '' })
  const [error, setError] = useState('')

  if (isAuthenticated) { navigate('/mes-transactions', { replace: true }); return null }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.phoneNumber || form.phoneNumber.length < 10) return setError('Numéro de téléphone invalide')
    if (!form.email || !form.email.includes('@')) return setError('Adresse email invalide')
    try {
      const res = await login(form)
      navigate('/verification-otp', { state: { userId: res.userId, otpSentTo: res.otpSentTo, phoneNumber: form.phoneNumber, email: form.email, name: form.name } })
    } catch (err) {
      setError(err.body?.message || 'Erreur de connexion. Réessayez.')
    }
  }

  return (
    <section className="page-hero" style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',padding:'120px 20px 60px'}}>
      <div className="mesh-bg">
        <div className="mesh-orb" style={{width:600,height:600,background:'rgba(238,146,33,.1)',top:'-30%',right:'-15%'}}></div>
        <div className="mesh-orb" style={{width:400,height:400,background:'rgba(28,63,113,.06)',bottom:'-20%',left:'-10%'}}></div>
      </div>
      <div className="auth-card" style={{position:'relative',zIndex:1}}>
        <div style={{textAlign:'center',marginBottom:32}}>
          <span className="section-tag">Connexion</span>
          <h1 style={{fontFamily:"var(--font-head)",fontWeight:900,fontSize:'clamp(1.6rem,3vw,2.2rem)',color:'var(--blue)',letterSpacing:'-.03em',marginTop:12}}>
            Bienvenue chez <em style={{color:'var(--orange)',fontStyle:'italic'}}>Rawbank</em>
          </h1>
          <p style={{fontSize:'.85rem',color:'var(--blue-2)',marginTop:8}}>Connectez-vous ou créez votre compte en un instant</p>
        </div>
        <form onSubmit={handleSubmit}>
          <label className="auth-label">Numéro de téléphone *</label>
          <input className="contact-input" type="tel" placeholder="+243 810 000 001" value={form.phoneNumber}
            onChange={e => setForm(f => ({...f, phoneNumber: e.target.value}))} required />
          <label className="auth-label">Adresse email *</label>
          <input className="contact-input" type="email" placeholder="votre@email.com" value={form.email}
            onChange={e => setForm(f => ({...f, email: e.target.value}))} required />
          <label className="auth-label">Nom complet <span style={{color:'var(--blue-2)',fontWeight:400}}>(optionnel)</span></label>
          <input className="contact-input" type="text" placeholder="Jean Dupont" value={form.name}
            onChange={e => setForm(f => ({...f, name: e.target.value}))} />
          {error && <p className="auth-error">{error}</p>}
          <button type="submit" className="btn-primary" disabled={loading}
            style={{width:'100%',padding:'14px',fontSize:'.9rem',marginTop:8}}>
            {loading ? 'Envoi du code...' : 'Recevoir le code OTP'}
          </button>
        </form>
        <p style={{textAlign:'center',marginTop:20,fontSize:'.78rem',color:'var(--blue-2)'}}>
          <Link to="/" style={{color:'var(--orange)',textDecoration:'none'}}>← Retour à l'accueil</Link>
        </p>
      </div>
    </section>
  )
}
