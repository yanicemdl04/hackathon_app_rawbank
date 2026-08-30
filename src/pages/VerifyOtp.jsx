import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { api } from '../lib/api'

export default function VerifyOtp() {
  const { verifyOtp, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { userId, otpSentTo, phoneNumber, email, name } = location.state || {}

  const [digits, setDigits] = useState(['','','','','',''])
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(60)
  const [retryAfter, setRetryAfter] = useState(0)
  const refs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()]

  useEffect(() => { refs[0].current?.focus() }, [])

  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  useEffect(() => {
    if (retryAfter <= 0) return
    const t = setInterval(() => setRetryAfter(c => c - 1), 1000)
    return () => clearInterval(t)
  }, [retryAfter])

  if (!userId) return (
    <section className="page-hero" style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',padding:'120px 20px'}}>
      <div className="auth-card" style={{textAlign:'center'}}>
        <p style={{color:'var(--blue-2)',marginBottom:16}}>Session expirée.</p>
        <Link to="/connexion" className="btn-primary" style={{textDecoration:'none',display:'inline-block'}}>Se reconnecter</Link>
      </div>
    </section>
  )

  const handleChange = useCallback((idx, val) => {
    if (val.length > 1) val = val.slice(-1)
    if (val && !/^\d$/.test(val)) return
    const next = [...digits]
    next[idx] = val
    setDigits(next)
    if (val && idx < 5) refs[idx + 1].current?.focus()
  }, [digits])

  const handleKeyDown = useCallback((idx, e) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) refs[idx - 1].current?.focus()
  }, [digits])

  const handlePaste = useCallback((e) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (text.length === 6) { setDigits(text.split('')); refs[5].current?.focus(); e.preventDefault() }
  }, [])

  const submit = async () => {
    const code = digits.join('')
    if (code.length < 6) return setError('Entrez les 6 chiffres')
    setError('')
    try {
      await verifyOtp({ userId, code })
      navigate('/mes-transactions', { replace: true })
    } catch (err) {
      const b = err.body || {}
      if (err.status === 410) { setError('Code expiré. Veuillez vous reconnecter.'); return }
      if (err.status === 429) { setRetryAfter(b.retryAfterSeconds || 900); setError(b.message); return }
      setError(b.message || 'Code incorrect')
      if (b.remainingAttempts !== undefined) setError(prev => `${prev} (${b.remainingAttempts} tentative(s) restante(s))`)
      setDigits(['','','','','',''])
      refs[0].current?.focus()
    }
  }

  useEffect(() => {
    if (digits.every(d => d !== '') && !loading) submit()
  }, [digits])

  const handleResend = async () => {
    try {
      await api.post('/auth/login-or-register', { phoneNumber, email, name })
      setCountdown(60)
      setError('')
      setDigits(['','','','','',''])
      refs[0].current?.focus()
    } catch { setError('Impossible de renvoyer le code.') }
  }

  return (
    <section className="page-hero" style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',padding:'120px 20px 60px'}}>
      <div className="mesh-bg">
        <div className="mesh-orb" style={{width:600,height:600,background:'rgba(238,146,33,.1)',top:'-30%',right:'-15%'}}></div>
        <div className="mesh-orb" style={{width:400,height:400,background:'rgba(28,63,113,.06)',bottom:'-20%',left:'-10%'}}></div>
      </div>
      <div className="auth-card" style={{position:'relative',zIndex:1,textAlign:'center'}}>
        <span className="section-tag">Vérification</span>
        <h1 style={{fontFamily:"var(--font-head)",fontWeight:900,fontSize:'1.6rem',color:'var(--blue)',marginTop:12,marginBottom:8}}>
          Entrez le code OTP
        </h1>
        <p style={{fontSize:'.85rem',color:'var(--blue-2)',marginBottom:32}}>
          Code envoyé à <strong>{otpSentTo}</strong>
        </p>

        {retryAfter > 0 ? (
          <p style={{color:'var(--orange)',fontSize:'.9rem',fontWeight:600}}>
            Trop de tentatives. Réessayez dans {Math.floor(retryAfter / 60)}:{String(retryAfter % 60).padStart(2, '0')}
          </p>
        ) : (
          <>
            <div className="otp-inputs" onPaste={handlePaste}>
              {digits.map((d, i) => (
                <input key={i} ref={refs[i]} type="text" inputMode="numeric" maxLength={1} value={d}
                  onChange={e => handleChange(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  className="otp-digit" disabled={loading} />
              ))}
            </div>
            {error && <p className="auth-error" style={{marginTop:16}}>{error}</p>}
            {loading && <p style={{fontSize:'.8rem',color:'var(--blue-2)',marginTop:12}}>Vérification en cours...</p>}
            <p style={{fontSize:'.78rem',color:'var(--blue-2)',marginTop:24}}>
              {countdown > 0
                ? `Renvoyer dans ${countdown}s`
                : <button onClick={handleResend} className="btn-ghost" style={{fontSize:'.78rem',color:'var(--orange)',padding:0}}>Renvoyer le code</button>
              }
            </p>
          </>
        )}
        <p style={{marginTop:20,fontSize:'.78rem'}}>
          <Link to="/connexion" style={{color:'var(--orange)',textDecoration:'none'}}>← Changer de numéro</Link>
        </p>
      </div>
    </section>
  )
}
