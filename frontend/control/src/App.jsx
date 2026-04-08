import { useEffect, useState } from 'react'
import './App.css'
import SystemSettings from './components/SystemSettings'
import WallpaperManager from './components/WallpaperManager'
import ClockSettings from './components/ClockSettings'
import WeatherSettings from './components/WeatherSettings'
import SoundVizSettings from './components/SoundVizSettings'

function App() {
  const [systemConfig, setSystemConfig] = useState(null)
  const [wallpaperConfig, setWallpaperConfig] = useState(null)
  const [clockConfig, setClockConfig] = useState(null)
  const [weatherConfig, setWeatherConfig] = useState(null)
  const [soundvizConfig, setSoundvizConfig] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      const [sysRes, wpRes, clockRes, weatherRes, soundvizRes] = await Promise.all([
        fetch('/api/system'),
        fetch('/api/wallpapers'),
        fetch('/api/clock'),
        fetch('/api/weather/config'),
        fetch('/api/soundviz'),
      ])
      setSystemConfig(await sysRes.json())
      setWallpaperConfig(await wpRes.json())
      setClockConfig(await clockRes.json())
      setWeatherConfig(await weatherRes.json())
      setSoundvizConfig(await soundvizRes.json())
    } catch (e) {
      console.error('Failed to fetch config:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  if (loading) {
    return <div className="loading">加载中...</div>
  }

  return (
    <div className="control-panel">
      <header className="panel-header">
        <h1>壁纸展示器 控制面板</h1>
      </header>

      <main className="panel-main">
        <section className="settings-section">
          <SystemSettings
            config={systemConfig}
            onUpdate={(data) => {
              setSystemConfig({ ...systemConfig, ...data })
            }}
          />
        </section>

        <section className="settings-section">
          <WallpaperManager
            config={wallpaperConfig}
            onUpdate={(data) => {
              setWallpaperConfig({ ...wallpaperConfig, ...data })
            }}
            onRefresh={fetchData}
          />
        </section>

        <section className="settings-section">
          <ClockSettings
            config={clockConfig}
            onUpdate={(data) => {
              setClockConfig({ ...clockConfig, ...data })
            }}
          />
        </section>

        <section className="settings-section">
          <WeatherSettings
            config={weatherConfig}
            onUpdate={(data) => {
              setWeatherConfig({ ...weatherConfig, ...data })
            }}
          />
        </section>

        <section className="settings-section">
          <SoundVizSettings
            config={soundvizConfig || {}}
            onUpdate={(data) => {
              setSoundvizConfig({ ...soundvizConfig, ...data })
            }}
          />
        </section>
      </main>
    </div>
  )
}

export default App