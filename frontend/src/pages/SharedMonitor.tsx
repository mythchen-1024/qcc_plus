import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import NodeCard from '../components/NodeCard'
import type { HealthCheckRecord, MonitorDashboard } from '../types'
import api from '../services/api'
import { useMonitorWebSocket } from '../hooks/useMonitorWebSocket'
import { formatBeijingTime } from '../utils/date'
import './SharedMonitor.css'

export default function SharedMonitor() {
  const { token } = useParams<{ token: string }>()
  const [dashboard, setDashboard] = useState<MonitorDashboard | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0)
  const [healthEvents, setHealthEvents] = useState<Record<string, HealthCheckRecord>>({})

  const { connected, lastMessage } = useMonitorWebSocket(undefined, token)

  useEffect(() => {
    async function fetchData() {
      if (!token) {
        setError('无效的分享链接')
        setLoading(false)
        return
      }
      try {
        const data = await api.getSharedMonitor(token)
        setDashboard(data)
        setHistoryRefreshKey((v) => v + 1)
        document.title = `${data.account_name} - 监控大屏`
      } catch (err) {
        setError('分享链接无效或已过期')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [token])

  // 处理 WebSocket 实时更新
  useEffect(() => {
    if (!lastMessage) return

    if (lastMessage.type === 'health_check') {
      const payload = lastMessage.payload
      setHealthEvents((prev) => ({
        ...prev,
        [payload.node_id]: {
          node_id: payload.node_id,
          check_time: payload.check_time,
          success: payload.success,
          response_time_ms: payload.response_time_ms ?? 0,
          error_message: payload.error_message || '',
          check_method: payload.check_method || 'api',
        },
      }))
      return
    }

    if (lastMessage.type !== 'node_status' && lastMessage.type !== 'node_metrics') return

    const payload = lastMessage.payload
    setDashboard((prev) => {
      if (!prev) return prev
      const idx = prev.nodes.findIndex((n) => n.id === payload.node_id)
      if (idx === -1) return prev
      const prevNode = prev.nodes[idx]
      const nextNode = {
        ...prevNode,
        status: (payload.status as typeof prevNode.status | undefined) || prevNode.status,
        last_error: payload.error ?? prevNode.last_error,
        success_rate: payload.success_rate ?? prevNode.success_rate,
        avg_response_time: payload.avg_response_time ?? prevNode.avg_response_time,
        total_requests: payload.total_requests ?? prevNode.total_requests,
        failed_requests: payload.failed_requests ?? prevNode.failed_requests,
        last_ping_ms: payload.last_ping_ms ?? prevNode.last_ping_ms,
        last_check_at: payload.timestamp || prevNode.last_check_at,
      }
      const nextNodes = prev.nodes.slice()
      nextNodes[idx] = nextNode
      return {
        ...prev,
        nodes: nextNodes,
        updated_at: payload.timestamp || prev.updated_at,
      }
    })
  }, [lastMessage])

  if (loading) {
    return <div className="shared-monitor-loading">加载中...</div>
  }

  if (error) {
    return (
      <div className="shared-monitor-error">
        <h2>{error}</h2>
        <p>请检查分享链接是否正确，或联系分享者获取新的链接。</p>
      </div>
    )
  }

  return (
    <div className="shared-monitor-page">
      <header>
        <h1>{dashboard?.account_name} · 监控大屏</h1>
        <div className="header-info">
          <span className={`ws-status ${connected ? 'connected' : 'disconnected'}`}>
            {connected ? '● 实时更新' : '○ 未连接'}
          </span>
          <p className="readonly-notice">
            只读模式 · 最近更新：{formatBeijingTime(dashboard?.updated_at)}
          </p>
        </div>
      </header>

      <div className="nodes-grid">
        {dashboard?.nodes.map((node) => (
          <NodeCard
            key={node.id}
            node={node}
            historyRefreshKey={historyRefreshKey}
            healthEvent={healthEvents[node.id]}
            shareToken={token}
          />
        ))}
      </div>

      <footer>
        <p>Powered by qcc_plus</p>
      </footer>
    </div>
  )
}
