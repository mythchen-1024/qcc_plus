import { useState } from 'react'
import Card from '../components/Card'
import { useSettings } from '../contexts/SettingsContext'
import './SystemSettings.css'

// 配置分类
const CATEGORIES = [
  { key: 'monitor', label: '显示设置' },
  { key: 'health', label: '监控设置' },
  { key: 'performance', label: '性能设置' },
  { key: 'notification', label: '通知设置' },
]

export default function SystemSettings() {
  const { settings, loading, updateSetting, refresh } = useSettings()
  const [activeCategory, setActiveCategory] = useState('monitor')
  const [saving, setSaving] = useState<string | null>(null)

  const handleChange = async (key: string, value: any) => {
    setSaving(key)
    try {
      await updateSetting(key, value)
    } catch (e: any) {
      alert(e?.message || '保存失败')
    } finally {
      setSaving(null)
    }
  }

  const filteredSettings = Object.values(settings).filter(s => s.category === activeCategory)

  return (
    <div className="system-settings-page">
      <div className="system-settings-header">
        <h1>系统设置</h1>
        <p className="sub">配置系统参数，包括监控、健康检查、性能等设置。</p>
      </div>

      <Card className="settings-card tabs-card">
        <div className="settings-toolbar">
          <div className="tab-group">
            {CATEGORIES.map(cat => (
              <button
                key={cat.key}
                type="button"
                className={`tab-btn ${activeCategory === cat.key ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.key)}
              >
                {cat.label}
              </button>
            ))}
          </div>
          <div className="spacer" />
          <button className="btn ghost" type="button" onClick={refresh} disabled={loading}>
            刷新
          </button>
        </div>
      </Card>

      <Card className="settings-card">
        <div className="settings-list">
          {loading ? (
            <div className="settings-loading">加载中...</div>
          ) : filteredSettings.length === 0 ? (
            <div className="no-settings">该分类暂无配置项</div>
          ) : (
            filteredSettings.map(setting => (
              <div key={setting.key} className={`setting-item ${saving === setting.key ? 'saving' : ''}`}>
                <div className="setting-info">
                  <div className="setting-key">{setting.key}</div>
                  <div className="setting-desc">{setting.description || '-'}</div>
                </div>
                <div className="setting-control">
                  {renderControl(setting, handleChange, saving === setting.key)}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  )
}

function renderControl(setting: any, onChange: (key: string, value: any) => void, saving: boolean) {
  const { key, value, data_type, is_secret } = setting

  if (is_secret) {
    return <span className="secret-mask">******</span>
  }

  switch (data_type) {
    case 'boolean':
      return (
        <label className="toggle">
          <input
            type="checkbox"
            checked={!!value}
            onChange={e => onChange(key, e.target.checked)}
            disabled={saving}
          />
          <span className="slider"></span>
        </label>
      )
    case 'number':
      return (
        <input
          type="number"
          value={value ?? ''}
          onChange={e => onChange(key, parseFloat(e.target.value))}
          disabled={saving}
        />
      )
    case 'object': {
      const stringified = value === undefined ? '' : JSON.stringify(value, null, 2)
      return (
        <textarea
          value={stringified}
          onChange={e => {
            try {
              onChange(key, JSON.parse(e.target.value))
            } catch {
              /* ignore parse errors */
            }
          }}
          disabled={saving}
        />
      )
    }
    default:
      return (
        <input
          type="text"
          value={value ?? ''}
          onChange={e => onChange(key, e.target.value)}
          disabled={saving}
        />
      )
  }
}
