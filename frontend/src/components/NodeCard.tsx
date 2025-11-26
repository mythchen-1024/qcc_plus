import type { HealthCheckRecord, MonitorNode } from '../types'
import { formatBeijingTime } from '../utils/date'
import HealthTimeline from './HealthTimeline'
import './NodeCard.css'

interface NodeCardProps {
	node: MonitorNode
	historyRefreshKey: number
	healthEvent?: HealthCheckRecord | null
	shareToken?: string
}

const statusLabel: Record<string, string> = {
  online: '在线',
  offline: '离线',
  disabled: '停用',
}

export default function NodeCard({ node, historyRefreshKey, healthEvent, shareToken }: NodeCardProps) {
	const resolvedStatus = node.disabled ? 'disabled' : node.status || 'offline'
	const successRate = Number.isFinite(node.success_rate) ? Number(node.success_rate) : 0
	const avgTime = Number.isFinite(node.avg_response_time) ? Number(node.avg_response_time) : 0
  const totalReq = Number(node.total_requests ?? 0)
  const failedReq = Number(node.failed_requests ?? 0)
  const lastCheck = node.last_check_at ? formatBeijingTime(node.last_check_at) : '暂无'
  const lastError = (node.last_error || '').trim()

	return (
		<div className="node-card">
			<div className="node-card__header">
				<div className="node-card__title-wrap">
					<div className="node-card__title">{node.name || '未命名节点'}</div>
					<div className="node-card__url">{node.url || '-'}</div>
				</div>
				<div className={`node-card__status ${resolvedStatus}`}>
					<span className="dot" />
					{statusLabel[resolvedStatus] || resolvedStatus || '未知'}
				</div>
			</div>

			<div className="node-card__metrics">
				<div className="node-card__metrics-row primary">
					<span>成功率 <strong>{successRate.toFixed(1)}%</strong></span>
					<span className="sep">|</span>
					<span>平均 <strong>{avgTime ? `${avgTime}ms` : '--'}</strong></span>
					<span className="sep">|</span>
					<span>请求 <strong>{totalReq.toLocaleString()}</strong></span>
				</div>
				<div className="node-card__metrics-row secondary">
					<span className={failedReq > 0 ? 'danger' : ''}>失败 <strong>{failedReq.toLocaleString()}</strong></span>
					<span className="sep">|</span>
					<span>权重 <strong>{node.weight ?? '-'}</strong></span>
					<span className="sep">|</span>
					<span>检查 <strong>{lastCheck}</strong></span>
				</div>
			</div>

			<HealthTimeline
				nodeId={node.id}
				refreshKey={historyRefreshKey}
				latest={healthEvent}
				shareToken={shareToken}
			/>

			<div className="node-card__footer">
				<div className="node-card__badges">
					{node.is_active && <span className="badge badge-primary">当前主用</span>}
					{node.disabled && <span className="badge badge-muted">已停用</span>}
				</div>
				{lastError && <div className="node-card__error">最后错误：{lastError}</div>}
			</div>
		</div>
	)
}
