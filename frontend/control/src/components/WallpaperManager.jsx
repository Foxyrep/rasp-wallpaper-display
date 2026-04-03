import { useState, useRef } from 'react'

function WallpaperManager({ config, onUpdate, onRefresh }) {
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef(null)

  const handleUpload = async (file) => {
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/wallpapers', {
        method: 'POST',
        body: formData,
      })
      if (res.ok) {
        onRefresh()
      }
    } catch (e) {
      console.error('Failed to upload:', e)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('确定删除这张壁纸？')) return
    try {
      const res = await fetch(`/api/wallpapers/${id}`, { method: 'DELETE' })
      if (res.ok) {
        onRefresh()
      }
    } catch (e) {
      console.error('Failed to delete:', e)
    }
  }

  const handleConfigChange = async (field, value) => {
    setSaving(true)
    try {
      const data = { [field]: value }
      const res = await fetch('/api/wallpapers/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        onUpdate(data)
      }
    } catch (e) {
      console.error('Failed to update config:', e)
    } finally {
      setSaving(false)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.currentTarget.classList.add('dragover')
  }

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove('dragover')
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.currentTarget.classList.remove('dragover')
    const file = e.dataTransfer.files[0]
    handleUpload(file)
  }

  return (
    <div>
      <h2 className="section-title">壁纸管理</h2>

      <div
        className="upload-area"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => handleUpload(e.target.files[0])}
        />
        <div className="upload-icon">📷</div>
        <p>{uploading ? '上传中...' : '点击或拖拽图片上传'}</p>
      </div>

      <div className="form-row">
        <label>自动轮播</label>
        <label className="toggle">
          <input
            type="checkbox"
            checked={config.auto_rotate}
            onChange={(e) => handleConfigChange('auto_rotate', e.target.checked)}
            disabled={saving}
          />
          <span className="toggle-slider"></span>
        </label>
      </div>

      {config.auto_rotate && (
        <div className="form-group">
          <label>轮播间隔（秒）</label>
          <input
            type="number"
            value={config.rotate_interval}
            min={5}
            max={3600}
            onChange={(e) => handleConfigChange('rotate_interval', parseInt(e.target.value) || 60)}
            disabled={saving}
          />
        </div>
      )}

      {config.images?.length > 0 && (
        <div className="image-grid">
          {config.images.map((img) => (
            <div key={img.id} className="image-item">
              <img src={`/api/wallpapers/${img.id}/file`} alt={img.original_name} />
              <button
                className="delete-btn"
                onClick={() => handleDelete(img.id)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default WallpaperManager