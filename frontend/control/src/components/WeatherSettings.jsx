import { useState } from 'react'

function WeatherSettings({ config, onUpdate }) {
  const [saving, setSaving] = useState(false)

  const handleChange = async (field, value) => {
    setSaving(true)
    try {
      const data = { [field]: value }
      const res = await fetch('/api/weather/config', {
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
      <h2 className="section-title">天气设置</h2>

      <div className="form-row">
        <label>显示天气</label>
        <label className="toggle">
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={(e) => handleChange('enabled', e.target.checked)}
            disabled={saving}
          />
          <span className="toggle-slider"></span>
        </label>
      </div>

      {config.enabled && (
        <>
          <div className="form-group">
            <label>显示天数</label>
            <select
              value={config.show_days}
              onChange={(e) => handleChange('show_days', parseInt(e.target.value))}
              disabled={saving}
            >
              <option value={1}>仅今天</option>
              <option value={3}>三天预报</option>
            </select>
          </div>

          <div className="form-group">
            <label>高德天气 API Key</label>
            <input
              type="text"
              className="text-input"
              value={config.api_key}
              onChange={(e) => handleChange('api_key', e.target.value)}
              disabled={saving}
              placeholder="高德开放平台API Key"
            />
          </div>

          <div className="form-group">
            <label>城市编码 (adcode)</label>
            <input
              type="text"
              className="text-input"
              value={config.city}
              onChange={(e) => handleChange('city', e.target.value)}
              disabled={saving}
              placeholder="如 510116 (成都双流区)"
            />
          </div>
        </>
      )}
    </div>
  )
}

export default WeatherSettings