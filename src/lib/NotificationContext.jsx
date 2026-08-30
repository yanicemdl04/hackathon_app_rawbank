import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { getSocket, joinUser, disconnectSocket } from './socket'
import { useAuth } from './AuthContext'

const NotificationContext = createContext(null)
const MAX_NOTIFS = 50

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (s < 60) return 'à l\'instant'
  if (s < 3600) return `il y a ${Math.floor(s / 60)} min`
  if (s < 86400) return `il y a ${Math.floor(s / 3600)}h`
  return `il y a ${Math.floor(s / 86400)}j`
}

export function NotificationProvider({ children }) {
  const { user, setUser } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const connectedRef = useRef(false)

  const addNotif = useCallback((notif) => {
    const item = { ...notif, id: Date.now() + Math.random(), time: new Date().toISOString(), read: false }
    setNotifications(prev => [item, ...prev].slice(0, MAX_NOTIFS))
    setUnreadCount(c => c + 1)
    return item
  }, [])

  useEffect(() => {
    if (!user?.id) {
      if (connectedRef.current) { disconnectSocket(); connectedRef.current = false }
      return
    }

    const socket = getSocket()
    joinUser(user.id)
    connectedRef.current = true

    socket.on('transaction:scored', (data) => {
      addNotif({ type: 'scored', ...data })
      const statusLabel = data.status === 'BLOCK' ? 'bloquée' : data.status === 'VERIFY' ? 'à vérifier' : 'approuvée'
      toast(
        `Transaction ${statusLabel}`,
        { description: `Score: ${data.riskScore}/100 — ${(data.reasons || []).join(', ')}`,
          duration: 5000 }
      )
    })

    socket.on('transaction:verified', (data) => {
      addNotif({ type: 'verified', ...data })
      toast.success('Transaction vérifiée par OTP')
    })

    socket.on('premium:fraud-alert', (data) => {
      addNotif({ type: 'premium-alert', ...data })
      toast.error(
        `Alerte fraude — ${data.userName || 'Client Premium'}`,
        { description: `${data.amount} ${data.devise} — Score: ${data.riskScore}`, duration: 8000 }
      )
    })

    socket.on('dispute:opened', (data) => {
      addNotif({ type: 'dispute-opened', ...data })
      toast('Signalement de fraude ouvert', { description: data.reason, duration: 5000 })
    })

    socket.on('dispute:updated', (data) => {
      addNotif({ type: 'dispute-updated', ...data })
      toast(`Signalement mis à jour → ${data.newStatus}`, { duration: 5000 })
    })

    socket.on('account:frozen', (data) => {
      addNotif({ type: 'frozen', ...data })
      toast.error('Compte gelé', { description: data.reason, duration: 10000 })
      setUser(prev => prev ? { ...prev, accountFrozen: true } : prev)
    })

    socket.on('account:unfrozen', (data) => {
      addNotif({ type: 'unfrozen', ...data })
      toast.success('Compte dégelé', { description: 'Vous pouvez à nouveau effectuer des transactions.', duration: 6000 })
      setUser(prev => prev ? { ...prev, accountFrozen: false } : prev)
    })

    return () => {
      socket.off('transaction:scored')
      socket.off('transaction:verified')
      socket.off('premium:fraud-alert')
      socket.off('dispute:opened')
      socket.off('dispute:updated')
      socket.off('account:frozen')
      socket.off('account:unfrozen')
    }
  }, [user?.id, addNotif, setUser])

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
    setUnreadCount(0)
  }, [])

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAllRead, clearAll, timeAgo }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotifications must be within NotificationProvider')
  return ctx
}
