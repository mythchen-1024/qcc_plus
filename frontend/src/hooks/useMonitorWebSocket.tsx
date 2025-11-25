import { useCallback, useEffect, useRef, useState } from 'react'
import type { WSMessage } from '../types'

export function useMonitorWebSocket(accountId?: string, token?: string) {
  const [connected, setConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<WSMessage | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const connect = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    const params = new URLSearchParams()
    if (accountId) params.set('account_id', accountId)
    if (token) params.set('token', token)
    const query = params.toString()
    const url = `${protocol}//${host}/api/monitor/ws${query ? `?${query}` : ''}`

    try {
      const ws = new WebSocket(url)

      ws.onopen = () => {
        setConnected(true)
      }

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WSMessage
          setLastMessage(message)
        } catch (err) {
          console.error('[WS] Failed to parse message:', err)
        }
      }

      ws.onerror = (error) => {
        console.error('[WS] Error:', error)
      }

      ws.onclose = () => {
        setConnected(false)
        wsRef.current = null
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
        }
        reconnectTimeoutRef.current = setTimeout(() => {
          connect()
        }, 5000)
      }

      wsRef.current = ws
    } catch (err) {
      console.error('[WS] Failed to connect:', err)
    }
  }, [accountId, token])

  useEffect(() => {
    connect()

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [connect])

  return { connected, lastMessage }
}
