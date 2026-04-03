import { useState } from 'react'

const STYLES = [
  { id: 'circle12', name: '圆形表盘', desc: '12小时制' },
  { id: 'digital24', name: '电子数字', desc: '24小时制' },
  { id: 'counter', name: '翻页计数', desc: '仿计数器风格' },
]

function ClockSettings({ config, onUpdate }) {
  const [saving, setSaving] = useState(false)

  const handleChange = async (field, value) => {
    setSaving(true)
    try {
      const data = { [field]: value }
      const res = await fetch('/api/clock', {
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
      <h2 className="section-title">时钟设置</h2>

      <div className="form-group">
        <label>时钟风格</label>
        <div className="style-selector">
          {STYLES.map((style) => (
            <div
              key={style.id}
              className={`style-option ${config.style === style.id ? 'active' : ''}`}
              onClick={() => handleChange('style', style.id)}
            >
              <div>{style.name}</div>
              <div style={{ fontSize: '0.75rem', marginTop: '4px' }}>{style.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="form-row">
        <label>显示年月日</label>
        <label className="toggle">
          <input
            type="checkbox"
            checked={config.show_date}
            onChange={(e) => handleChange('show_date', e.target.checked)}
            disabled={saving}
          />
          <span className="toggle-slider"></span>
        </label>
      </div>

      <div className="form-row">
        <label>显示星期几</label>
        <label className="toggle">
          <input
            type="checkbox"
            checked={config.show_weekday}
            onChange={(e) => handleChange('show_weekday', e.target.checked)}
            disabled={saving}
          />
          <span className="toggle-slider"></span>
        </label>
      </div>
    </div>
  )
}

export default ClockSettings