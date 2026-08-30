import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotifications } from '../lib/NotificationContext'

const ICON_MAP = {
  'scored': { color: 'var(--orange)', label: 'Transaction analysée' },
  'verified': { color: '#3b82f6', label: 'Transaction vérifiée' },
  'premium-alert': { color: '#e53e3e', label: 'Alerte premium' },
  'dispute-opened': { color: '#e53e3e', label: 'Signalement ouvert' },
  'dispute-updated': { color: 'var(--blue-2)', label: 'Signalement mis à jour' },
  'frozen': { color: '#e53e3e', label: 'Compte gelé' },
  'unfrozen': { color: 'var(--green)', label: 'Compte dégelé' },
}

export default function NotificationBell() {
  const { notifications, unreadCount, markAllRead, clearAll, timeAgo } = useNotifications()
  const [open, setOpen] = useState(false)
  const ref = useRef()
  const navigate = useNavigate()

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleClick = (n) => {
    if (n.transactionId && (n.type === 'scored' || n.type === 'verified' || n.type === 'premium-alert')) {
      navigate(`/transactions/${n.transactionId}`)
      setOpen(false)
    } else if (n.type === 'dispute-opened' || n.type === 'dispute-updated') {
      navigate('/signalements')
      setOpen(false)
    }
  }

  return (
    <div className="notif-bell-wrap" ref={ref}>
      <button className="notif-bell" onClick={() => { setOpen(!open); if (!open) markAllRead() }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {unreadCount > 0 && <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>

      {open && (
        <div className="notif-dropdown">
          <div className="notif-header">
            <span style={{fontWeight:600,fontSize:'.85rem',color:'var(--blue)'}}>Notifications</span>
            {notifications.length > 0 && (
              <button onClick={clearAll} style={{background:'none',border:'none',fontSize:'.7rem',color:'var(--orange)',cursor:'pointer'}}>
                Tout effacer
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <div className="notif-empty">Aucune notification</div>
          ) : (
            <div className="notif-list">
              {notifications.map(n => {
                const meta = ICON_MAP[n.type] || { color: 'var(--blue-2)', label: 'Notification' }
                return (
                  <div key={n.id}
                    className={`notif-item ${!n.read ? 'notif-unread' : ''}`}
                    onClick={() => handleClick(n)}>
                    <div className="notif-dot" style={{background: meta.color}} />
                    <div style={{flex:1,minWidth:0}}>
                      <div className="notif-title">{meta.label}</div>
                      {n.status && <span className="notif-status" style={{color: meta.color}}>{n.status}</span>}
                      {n.riskScore !== undefined && <span className="notif-score">Score: {n.riskScore}</span>}
                      {n.reason && <div className="notif-reason">{n.reason}</div>}
                    </div>
                    <span className="notif-time">{timeAgo(n.time)}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
