import { useEffect, useRef, useState } from 'react'
import './App.css'
import WallpaperDisplay from './components/WallpaperDisplay'
import ClockCircle12 from './components/ClockCircle12'
import ClockDigital24 from './components/ClockDigital24'
import ClockCounter from './components/ClockCounter'
import WeatherDisplay from './components/WeatherDisplay'
import SoundVisualizer from './components/SoundVisualizer'

const DEFAULT_CONFIG = {
  mode: 'wallpaper',
  auto_switch: false,
  auto_switch_duration: 30,
  wallpaper: { images: [], auto_rotate: true, rotate_interval: 60 },
  clock: { style: 'circle12', show_date: true, show_weekday: true },
  weather: { enabled: false, show_days: 1 },
  soundviz: {
    style: 'bar',
    color: '#00ff88',
    sensitivity: 1.0,
    performance_mode: 'balanced',
    fps: 30,
    render_scale: 0.8,
  },
}

function App() {
  const [config, setConfig] = useState(DEFAULT_CONFIG)
  const [weatherData, setWeatherData] = useState(null)
  const [activeMode, setActiveMode] = useState('wallpaper')
  const wsRef = useRef(null)
  const autoSwitchTimerRef = useRef(null)
  const weatherTimerRef = useRef(null)

  useEffect(() => {
    const ws = new WebSocket(
      `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.hostname}:5000/ws`
    )
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data)
        if (msg.type === 'config') {
          setConfig(msg.data)
        }
      } catch {}
    }
    ws.onclose = () => {
      setTimeout(() => window.location.reload(), 3000)
    }
    wsRef.current = ws
    return () => ws.close()
  }, [])

  // Fetch weather periodically
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch('/api/weather')
        if (res.ok) {
          const data = await res.json()
          setWeatherData(data)
        }
      } catch {}
    }

    fetchWeather()
    weatherTimerRef.current = setInterval(fetchWeather, 10 * 60 * 1000)
    return () => {
      if (weatherTimerRef.current) clearInterval(weatherTimerRef.current)
    }
  }, [config.weather?.enabled, config.weather?.show_days, config.weather?.api_key, config.weather?.city])

  // Auto switch logic
  useEffect(() => {
    if (autoSwitchTimerRef.current) {
      clearInterval(autoSwitchTimerRef.current)
      autoSwitchTimerRef.current = null
    }

    if (config.auto_switch) {
      const duration = (config.auto_switch_duration || 30) * 1000
      autoSwitchTimerRef.current = setInterval(() => {
        setActiveMode((prev) => (prev === 'wallpaper' ? 'clock' : 'wallpaper'))
      }, duration)
    }

    if (!config.auto_switch) {
      setActiveMode(config.mode === 'auto' ? 'wallpaper' : config.mode)
    } else {
      setActiveMode('wallpaper')
    }

    return () => {
      if (autoSwitchTimerRef.current) clearInterval(autoSwitchTimerRef.current)
    }
  }, [config.mode, config.auto_switch, config.auto_switch_duration])

  const clockProps = {
    showDate: config.clock.show_date,
    showWeekday: config.clock.show_weekday,
  }

  const renderClock = () => {
    switch (config.clock.style) {
      case 'digital24':
        return <ClockDigital24 {...clockProps} />
      case 'counter':
        return <ClockCounter {...clockProps} />
      default:
        return <ClockCircle12 {...clockProps} />
    }
  }

  const showWeather = activeMode === 'clock' && weatherData?.enabled

  const renderContent = () => {
    if (activeMode === 'soundviz') {
      return (
        <SoundVisualizer
          style={config.soundviz?.style || 'bar'}
          color={config.soundviz?.color || '#00ff88'}
          sensitivity={config.soundviz?.sensitivity || 1.0}
          performanceMode={config.soundviz?.performance_mode || 'balanced'}
          fps={config.soundviz?.fps || 30}
          renderScale={config.soundviz?.render_scale || 0.8}
        />
      )
    }
    if (activeMode === 'wallpaper') {
      return (
        <WallpaperDisplay
          images={config.wallpaper.images}
          autoRotate={config.wallpaper.auto_rotate}
          rotateInterval={config.wallpaper.rotate_interval}
        />
      )
    }
    return renderClock()
  }

  return (
    <div className="display-container">
      {showWeather && (
        <div className="weather-overlay">
          <WeatherDisplay weatherData={weatherData} />
        </div>
      )}
      {renderContent()}
    </div>
  )
}

export default App
