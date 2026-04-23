import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Client } from '@stomp/stompjs'
import toast from 'react-hot-toast'
import { useAuth } from './AuthContext'
import { deleteNotification, fetchNotifications, markNotificationRead } from '../services/notificationApi'

const NotificationContext = createContext(null)

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

function sortNewestFirst(list) {
  return [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export function NotificationProvider({ children }) {
  const { isAuthenticated, user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const clientRef = useRef(null)

  const unreadCount = useMemo(() => notifications.filter((n) => !n.isRead).length, [notifications])

  const refresh = useCallback(async () => {
    if (!isAuthenticated) return
    setLoading(true)
    try {
      const data = await fetchNotifications()
      setNotifications(sortNewestFirst(data))
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  const markAsRead = useCallback(async (id) => {
    const updated = await markNotificationRead(id)
    setNotifications((current) => sortNewestFirst(current.map((n) => (n.id === id ? updated : n))))
  }, [])

  const remove = useCallback(async (id) => {
    await deleteNotification(id)
    setNotifications((current) => current.filter((n) => n.id !== id))
  }, [])

  const addNotification = useCallback((n) => {
    setNotifications((current) => sortNewestFirst([n, ...current.filter((x) => x.id !== n.id)]))
  }, [])

  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([])
      return
    }
    refresh()
  }, [isAuthenticated, refresh])

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return

    const wsUrl = API_BASE_URL.replace(/^http/, 'ws')
    const client = new Client({
      brokerURL: `${wsUrl}/ws`,
      reconnectDelay: 3000,
      onConnect: () => {
        client.subscribe(`/topic/users/${user.id}/notifications`, (message) => {
          try {
            const payload = JSON.parse(message.body)
            addNotification(payload)
            toast.custom((t) => (
              <div
                className={`${
                  t.visible ? 'animate-enter' : 'animate-leave'
                } max-w-md w-full bg-white/80 backdrop-blur-xl shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black/5 overflow-hidden border border-white/20`}
              >
                <div className="flex-1 w-0 p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 pt-0.5">
                      <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-bold text-slate-900">
                        New Notification
                      </p>
                      <p className="mt-1 text-sm text-slate-600 leading-snug">
                        {payload.message}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex border-l border-slate-100">
                  <button
                    onClick={() => toast.dismiss(t.id)}
                    className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-bold text-indigo-600 hover:text-indigo-500 focus:outline-none"
                  >
                    Close
                  </button>
                </div>
              </div>
            ), {
              duration: 6000,
              position: 'top-right'
            })
          } catch (error) {
            console.error('WS Error:', error)
          }
        })
      },
    })

    client.activate()
    clientRef.current = client

    return () => {
      clientRef.current?.deactivate()
      clientRef.current = null
    }
  }, [isAuthenticated, user?.id, addNotification])

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      loading,
      refresh,
      markAsRead,
      remove,
      addNotification,
    }),
    [notifications, unreadCount, loading, refresh, markAsRead, remove, addNotification],
  )

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export function useNotifications() {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider')
  return ctx
}

