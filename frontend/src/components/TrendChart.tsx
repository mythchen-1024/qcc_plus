import {
  CategoryScale,
  Chart as ChartJS,
  type ChartDataset,
  type ChartOptions,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import type { TrendPoint } from '../types'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend)

interface TrendChartProps {
  data: TrendPoint[]
}

export default function TrendChart({ data }: TrendChartProps) {
  const hasData = Array.isArray(data) && data.length > 0
  const labels = hasData
    ? data.map((p) => new Date(p.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }))
    : ['--']

  const successSeries = hasData ? data.map((p) => p.success_rate) : [0]
  const timeSeries = hasData ? data.map((p) => p.avg_time) : [0]
  const hasTimeSeries = hasData && timeSeries.some((v) => Number.isFinite(v))

  const datasets: ChartDataset<'line', number[]>[] = [
    {
      label: '成功率',
      data: successSeries,
      borderColor: '#22c55e',
      backgroundColor: 'rgba(34, 197, 94, 0.12)',
      tension: 0.35,
      fill: true,
      pointRadius: 2.5,
      borderWidth: 2,
      yAxisID: 'y',
    },
  ]

  if (hasTimeSeries) {
    datasets.push({
      label: '响应时间(ms)',
      data: timeSeries,
      borderColor: '#38bdf8',
      backgroundColor: 'rgba(56, 189, 248, 0.12)',
      tension: 0.35,
      fill: false,
      pointRadius: 2,
      borderDash: [4, 4],
      yAxisID: 'y1',
    })
  }

  const chartData = { labels, datasets }

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        labels: {
          color: 'rgba(255, 255, 255, 0.75)',
          usePointStyle: true,
        },
      },
      tooltip: {
        callbacks: {
          label(ctx) {
            const label = ctx.dataset.label || ''
            const val = ctx.parsed.y
            if (val === null || val === undefined) return label
            if (label.includes('成功率')) return `${label}: ${val.toFixed(1)}%`
            return `${label}: ${Math.round(val)}ms`
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: 'rgba(255, 255, 255, 0.55)', maxRotation: 0, autoSkip: true, maxTicksLimit: 6 },
      },
      y: {
        min: 0,
        max: 100,
        ticks: {
          color: 'rgba(255, 255, 255, 0.65)',
          callback: (value) => `${value}%`,
        },
        grid: { color: 'rgba(255, 255, 255, 0.08)' },
      },
      y1: {
        display: hasTimeSeries,
        position: 'right',
        ticks: { color: 'rgba(255, 255, 255, 0.65)' },
        grid: { drawOnChartArea: false },
      },
    },
  }

  return (
    <div className="trend-chart">
      <Line data={chartData} options={options} />
    </div>
  )
}
