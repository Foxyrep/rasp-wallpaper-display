import { useState } from 'react'

function SystemSettings({ config, onUpdate }) {
  const [saving, setSaving] = useState(false)

  const handleChange = async (field, value) => {
    setSaving(true)
    try {
      const data = { [field]: value }
      const res = await fetch('/api/system', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        onUpdate(data)
      }
    } catch (e) {
      console.error('Failed to update:', e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <h2 className="section-title">系统设置</h2>

      <div className="form-group">
        <label>显示模式</label>
        <select
          value={config.mode}
          onChange={(e) => handleChange('mode', e.target.value)}
          disabled={saving}
        >
          <option value="wallpaper">壁纸</option>
          <option value="clock">时钟</option>
          <option value="auto">自动切换</option>
        </select>
      </div>

      <div className="form-row">
        <label>自动切换</label>
        <label className="toggle">
          <input
            type="checkbox"
            checked={config.auto_switch}
            onChange={(e) => handleChange('auto_switch', e.target.checked)}
            disabled={saving}
          />
          <span className="toggle-slider"></span>
        </label>
      </div>

      {config.auto_switch && (
        <div className="form-group">
          <label>每个功能持续时间（秒）</label>
          <input
            type="number"
            value={config.auto_switch_duration}
            min={5}
            max={3600}
            onChange={(e) => handleChange('auto_switch_duration', parseInt(e.target.value) || 30)}
            disabled={saving}
          />
        </div>
      )}
    </div>
  )
}

export default SystemSettings