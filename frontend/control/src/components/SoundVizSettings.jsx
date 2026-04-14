import { useState } from 'react'

const STYLES = [
  { id: 'bar', name: '频谱柱状', desc: '底部向上柱状图' },
  { id: 'circular', name: '环形波形', desc: '圆形放射状' },
  { id: 'wave', name: '流动波线', desc: '全屏平滑曲线' },
]

const COLORS = [
  { id: '#00ff88', name: '绿' },
  { id: '#00b4ff', name: '蓝' },
  { id: '#ff3366', name: '红' },
  { id: '#ffaa00', name: '橙' },
  { id: '#aa44ff', name: '紫' },
  { id: '#00ffff', name: '青' },
  { id: 'rainbow', name: '彩' },
]

const PERFORMANCE_MODES = [
  { id: 'power_save', name: '省电', desc: '最低资源占用，优先流畅' },
  { id: 'balanced', name: '均衡', desc: '推荐默认档位' },
  { id: 'quality', name: '高画质', desc: '更细腻，但更吃性能' },
]

function SoundVizSettings({ config, onUpdate }) {
  const [saving, setSaving] = useState(false)

  const handleChange = async (field, value) => {
    setSaving(true)
    try {
      const data = { [field]: value }
      const res = await fetch('/api/soundviz', {
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
      <h2 className="section-title">环境声可视化</h2>

      <div className="form-group">
        <label>可视化风格</label>
        <div className="style-selector">
          {STYLES.map((s) => (
            <div
              key={s.id}
              className={`style-option ${config.style === s.id ? 'active' : ''}`}
              onClick={() => handleChange('style', s.id)}
            >
              <div>{s.name}</div>
              <div style={{ fontSize: '0.75rem', marginTop: '4px' }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label>主题颜色</label>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {COLORS.map((c) => (
            <div
              key={c.id}
              onClick={() => handleChange('color', c.id)}
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: c.id === 'rainbow'
                  ? 'linear-gradient(135deg, #ff3366 0%, #ffaa00 20%, #00ff88 40%, #00ffff 60%, #00b4ff 80%, #aa44ff 100%)'
                  : c.id,
                cursor: 'pointer',
                border: config.color === c.id ? '3px solid #333' : '3px solid transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.65rem',
                color: '#fff',
                textShadow: '0 1px 2px rgba(0,0,0,0.5)',
              }}
            >
              {c.name}
            </div>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label>灵敏度: {config.sensitivity?.toFixed(1) || '1.0'}</label>
        <input
          type="range"
          min="0.5"
          max="3.0"
          step="0.1"
          value={config.sensitivity || 1.0}
          onChange={(e) => handleChange('sensitivity', parseFloat(e.target.value))}
          disabled={saving}
          style={{ width: '100%' }}
        />
      </div>

      <div className="form-group">
        <label>性能档位</label>
        <div className="style-selector">
          {PERFORMANCE_MODES.map((mode) => (
            <div
              key={mode.id}
              className={`style-option ${config.performance_mode === mode.id ? 'active' : ''}`}
              onClick={() => handleChange('performance_mode', mode.id)}
            >
              <div>{mode.name}</div>
              <div style={{ fontSize: '0.75rem', marginTop: '4px' }}>{mode.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label>目标帧率: {config.fps || 30} FPS</label>
        <input
          type="range"
          min="15"
          max="60"
          step="5"
          value={config.fps || 30}
          onChange={(e) => handleChange('fps', parseInt(e.target.value, 10))}
          disabled={saving}
          style={{ width: '100%' }}
        />
      </div>

      <div className="form-group">
        <label>渲染比例: {((config.render_scale || 0.8) * 100).toFixed(0)}%</label>
        <input
          type="range"
          min="0.5"
          max="1.0"
          step="0.1"
          value={config.render_scale || 0.8}
          onChange={(e) => handleChange('render_scale', parseFloat(e.target.value))}
          disabled={saving}
          style={{ width: '100%' }}
        />
      </div>
    </div>
  )
}

export default SoundVizSettings
