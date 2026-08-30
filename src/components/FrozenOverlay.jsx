import { useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import { api } from '../lib/api'

export default function FrozenOverlay() {
  const { user, setUser } = useAuth()
  const [unfreezing, setUnfreezing] = useState(false)

  const handleUnfreeze = async () => {
    setUnfreezing(true)
    try {
      await api.post(`/users/${user.id}/unfreeze`, {})
      setUser(prev => prev ? { ...prev, accountFrozen: false } : prev)
    } catch { /* l'événement socket account:unfrozen fera le reste */ }
    setUnfreezing(false)
  }

  return (
    <div className="frozen-overlay">
      <div className="frozen-card">
        <div className="frozen-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--orange)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <h2 style={{fontFamily:"var(--font-head)",fontWeight:900,fontSize:'1.6rem',color:'var(--blue)',marginBottom:12}}>
          Compte gelé
        </h2>
        <p style={{color:'var(--blue-2)',lineHeight:1.7,marginBottom:24,maxWidth:400}}>
          Votre application a été gelée suite à un signalement de fraude.
          Veuillez vous rendre en agence bancaire pour le suivi de votre dossier.
        </p>
        <div style={{fontFamily:"'SF Mono','Segoe UI Mono','Roboto Mono',monospace",fontSize:'.7rem',color:'var(--orange)',letterSpacing:'.1em',marginBottom:28}}>
          CONTACTEZ LE +243 99 60 60 060
        </div>
        <button className="btn-primary" onClick={handleUnfreeze} disabled={unfreezing} style={{fontSize:'.82rem'}}>
          {unfreezing ? 'Vérification...' : 'Simuler la levée du gel (agence)'}
        </button>
      </div>
    </div>
  )
}
