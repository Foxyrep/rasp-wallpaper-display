import { useEffect, useState, useRef } from 'react'

function WallpaperDisplay({ images, autoRotate, rotateInterval }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loadedImages, setLoadedImages] = useState([])
  const timerRef = useRef(null)

  useEffect(() => {
    if (!images.length) return

    const loadImages = async () => {
      const loaded = await Promise.all(
        images.map(async (img) => {
          try {
            const res = await fetch(`/api/wallpapers/${img.id}/file`)
            if (!res.ok) return null
            return { ...img, url: `/api/wallpapers/${img.id}/file` }
          } catch {
            return null
          }
        })
      )
      setLoadedImages(loaded.filter(Boolean))
    }

    loadImages()
  }, [images])

  useEffect(() => {
    if (!loadedImages.length) return

    if (autoRotate && rotateInterval > 0) {
      timerRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % loadedImages.length)
      }, rotateInterval * 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [loadedImages.length, autoRotate, rotateInterval])

  if (!loadedImages.length) {
    return (
      <div className="wallpaper-container">
        <div className="no-wallpaper">
          <p>暂无壁纸</p>
          <p style={{ fontSize: '1.5vw', opacity: 0.6, marginTop: '1vw' }}>
            请在控制面板上传图片
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="wallpaper-container">
      {loadedImages.map((img, idx) => (
        <img
          key={img.id}
          src={img.url}
          alt={img.original_name}
          className={`wallpaper-image ${idx === currentIndex ? 'active' : ''}`}
        />
      ))}
    </div>
  )
}

export default WallpaperDisplay