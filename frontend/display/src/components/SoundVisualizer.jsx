import { useEffect, useRef, useCallback } from 'react'

const PERFORMANCE_PRESETS = {
  power_save: {
    fftSize: 512,
    barCount: 28,
    circularBars: 48,
    waveSamples: 80,
    shadowBlur: 0,
    trailAlpha: 0.22,
  },
  balanced: {
    fftSize: 1024,
    barCount: 40,
    circularBars: 72,
    waveSamples: 128,
    shadowBlur: 8,
    trailAlpha: 0.16,
  },
  quality: {
    fftSize: 2048,
    barCount: 56,
    circularBars: 96,
    waveSamples: 192,
    shadowBlur: 12,
    trailAlpha: 0.12,
  },
}

const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value))

function SoundVisualizer({
  style = 'bar',
  color = '#00ff88',
  sensitivity = 1.0,
  performanceMode = 'balanced',
  fps = 30,
  renderScale = 0.8,
}) {
  const canvasRef = useRef(null)
  const audioCtxRef = useRef(null)
  const analyserRef = useRef(null)
  const streamRef = useRef(null)
  const animFrameRef = useRef(null)
  const freqDataRef = useRef(null)
  const timeDataRef = useRef(null)
  const timeLabelRef = useRef({ second: '', text: '' })
  const gradientCacheRef = useRef({})
  const frameStateRef = useRef({ lastFrame: 0 })

  const getPreset = useCallback(() => {
    return PERFORMANCE_PRESETS[performanceMode] || PERFORMANCE_PRESETS.balanced
  }, [performanceMode])

  const getTimeLabel = useCallback(() => {
    const now = new Date()
    const secondKey = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`
    if (timeLabelRef.current.second !== secondKey) {
      const h = String(now.getHours()).padStart(2, '0')
      const m = String(now.getMinutes()).padStart(2, '0')
      const s = String(now.getSeconds()).padStart(2, '0')
      timeLabelRef.current = { second: secondKey, text: `${h}:${m}:${s}` }
    }
    return timeLabelRef.current.text
  }, [])

  const drawTime = useCallback((ctx, width, height, x, y, fontSize) => {
    ctx.save()
    ctx.font = `200 ${fontSize}px 'Segoe UI', sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = color === 'rainbow' ? 'rgba(255, 255, 255, 0.35)' : `${color}55`
    ctx.fillText(getTimeLabel(), x, y, width * 0.9)
    ctx.restore()
  }, [color, getTimeLabel])

  const getRainbowGradient = useCallback((ctx, width, height, direction = 'vertical') => {
    const cacheKey = `${direction}-${width}-${height}`
    if (gradientCacheRef.current[cacheKey]) {
      return gradientCacheRef.current[cacheKey]
    }

    const gradient = direction === 'horizontal'
      ? ctx.createLinearGradient(0, 0, width, 0)
      : ctx.createLinearGradient(0, height, 0, 0)

    gradient.addColorStop(0, '#ff3366')
    gradient.addColorStop(0.2, '#ffaa00')
    gradient.addColorStop(0.4, '#00ff88')
    gradient.addColorStop(0.6, '#00ffff')
    gradient.addColorStop(0.8, '#00b4ff')
    gradient.addColorStop(1, '#aa44ff')

    gradientCacheRef.current[cacheKey] = gradient
    return gradient
  }, [])

  const getRainbowColor = useCallback((t, alpha = 1) => {
    const hue = (t * 360) % 360
    return `hsla(${hue}, 100%, 55%, ${alpha})`
  }, [])

  const clearFrame = useCallback((ctx, width, height, alpha) => {
    ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`
    ctx.fillRect(0, 0, width, height)
  }, [])

  const drawBar = useCallback((ctx, analyser, width, height, preset) => {
    const dataArray = freqDataRef.current
    analyser.getByteFrequencyData(dataArray)

    clearFrame(ctx, width, height, preset.trailAlpha)

    const barCount = preset.barCount
    const gap = Math.max(2, width * 0.004)
    const barWidth = (width - gap * (barCount - 1)) / barCount
    const step = Math.max(1, Math.floor(dataArray.length / barCount))
    const fill = color === 'rainbow' ? getRainbowGradient(ctx, width, height) : color

    ctx.fillStyle = fill
    for (let i = 0; i < barCount; i++) {
      let sum = 0
      const baseIndex = i * step
      for (let j = 0; j < step; j++) {
        sum += dataArray[baseIndex + j] || 0
      }
      const avg = (sum / step) * sensitivity
      const barHeight = clamp((avg / 255) * height * 0.82, 6, height * 0.82)
      const x = i * (barWidth + gap)
      ctx.globalAlpha = clamp(0.45 + avg / 255, 0.45, 1)
      ctx.fillRect(x, height - barHeight, barWidth, barHeight)
    }
    ctx.globalAlpha = 1

    drawTime(ctx, width, height, width / 2, height * 0.12, height * 0.06)
  }, [clearFrame, color, drawTime, getRainbowGradient, sensitivity])

  const drawCircular = useCallback((ctx, analyser, width, height, preset) => {
    const dataArray = freqDataRef.current
    analyser.getByteFrequencyData(dataArray)

    clearFrame(ctx, width, height, preset.trailAlpha * 0.8)

    const cx = width / 2
    const cy = height / 2
    const baseRadius = Math.min(cx, cy) * 0.24
    const maxRadius = Math.min(cx, cy) * 0.62
    const bars = preset.circularBars
    const step = Math.max(1, Math.floor(dataArray.length / bars))
    const lineWidth = Math.max(1.5, (Math.PI * 2 * baseRadius) / bars * 0.72)

    ctx.lineCap = 'round'
    ctx.lineWidth = lineWidth
    for (let i = 0; i < bars; i++) {
      let sum = 0
      const baseIndex = i * step
      for (let j = 0; j < step; j++) {
        sum += dataArray[baseIndex + j] || 0
      }
      const avg = (sum / step) * sensitivity
      const length = (avg / 255) * (maxRadius - baseRadius)
      const angle = (i / bars) * Math.PI * 2 - Math.PI / 2
      const x1 = cx + Math.cos(angle) * baseRadius
      const y1 = cy + Math.sin(angle) * baseRadius
      const x2 = cx + Math.cos(angle) * (baseRadius + length)
      const y2 = cy + Math.sin(angle) * (baseRadius + length)

      ctx.strokeStyle = color === 'rainbow'
        ? getRainbowColor(i / bars, clamp(0.35 + avg / 255, 0.35, 1))
        : color
      ctx.globalAlpha = color === 'rainbow' ? 1 : clamp(0.3 + avg / 255, 0.3, 1)
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.stroke()
    }
    ctx.globalAlpha = 1

    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseRadius)
    glow.addColorStop(0, color === 'rainbow' ? 'rgba(255,255,255,0.12)' : `${color}22`)
    glow.addColorStop(1, 'transparent')
    ctx.fillStyle = glow
    ctx.beginPath()
    ctx.arc(cx, cy, baseRadius, 0, Math.PI * 2)
    ctx.fill()

    drawTime(ctx, width, height, cx, cy, height * 0.045)
  }, [clearFrame, color, drawTime, getRainbowColor, sensitivity])

  const traceWave = useCallback((ctx, dataArray, width, centerY, amplitude, offset, step) => {
    let x = 0
    ctx.beginPath()
    for (let i = 0; i < dataArray.length; i += step) {
      const v = (dataArray[i] / 128 - 1 + offset) * sensitivity
      const y = centerY + v * amplitude
      if (x === 0) ctx.moveTo(0, y)
      else ctx.lineTo(x, y)
      x += width / Math.ceil(dataArray.length / step)
    }
    ctx.stroke()
  }, [sensitivity])

  const drawWave = useCallback((ctx, analyser, width, height, preset) => {
    const dataArray = timeDataRef.current
    analyser.getByteTimeDomainData(dataArray)

    clearFrame(ctx, width, height, preset.trailAlpha * 0.65)

    const centerY = height * 0.55
    const amplitude = height * 0.24
    const step = Math.max(1, Math.floor(dataArray.length / preset.waveSamples))
    const gradient = color === 'rainbow' ? getRainbowGradient(ctx, width, height, 'horizontal') : null
    const layers = [
      { offset: 0, alpha: 0.85, lineWidth: 2.4 },
      { offset: -0.02, alpha: 0.4, lineWidth: 1.6 },
      { offset: 0.02, alpha: 0.4, lineWidth: 1.6 },
    ]

    if (preset.shadowBlur > 0) {
      ctx.shadowColor = color === 'rainbow' ? '#ffffff' : color
      ctx.shadowBlur = preset.shadowBlur
    }

    for (const layer of layers) {
      ctx.lineWidth = layer.lineWidth
      ctx.globalAlpha = layer.alpha
      ctx.strokeStyle = gradient || color
      traceWave(ctx, dataArray, width, centerY, amplitude, layer.offset, step)
    }

    ctx.shadowBlur = 0
    ctx.globalAlpha = 1

    drawTime(ctx, width, height, width / 2, height * 0.12, height * 0.06)
  }, [clearFrame, color, drawTime, getRainbowGradient, traceWave])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined

    const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true })
    if (!ctx) return undefined

    const targetScale = clamp(renderScale, 0.5, 1)
    const deviceRatio = clamp((window.devicePixelRatio || 1) * targetScale, 0.5, 1.25)

    const resizeCanvas = () => {
      const cssWidth = window.innerWidth
      const cssHeight = window.innerHeight
      canvas.width = Math.max(1, Math.round(cssWidth * deviceRatio))
      canvas.height = Math.max(1, Math.round(cssHeight * deviceRatio))
      canvas.style.width = `${cssWidth}px`
      canvas.style.height = `${cssHeight}px`
      ctx.setTransform(deviceRatio, 0, 0, deviceRatio, 0, 0)
      gradientCacheRef.current = {}
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    let cancelled = false

    const stopAudio = () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
        animFrameRef.current = null
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close()
        audioCtxRef.current = null
      }
      analyserRef.current = null
      freqDataRef.current = null
      timeDataRef.current = null
    }

    const renderFrame = (timestamp) => {
      if (cancelled || document.hidden) {
        animFrameRef.current = requestAnimationFrame(renderFrame)
        return
      }

      const frameInterval = 1000 / clamp(fps, 15, 60)
      if (timestamp - frameStateRef.current.lastFrame < frameInterval) {
        animFrameRef.current = requestAnimationFrame(renderFrame)
        return
      }
      frameStateRef.current.lastFrame = timestamp

      const analyser = analyserRef.current
      if (!analyser) {
        animFrameRef.current = requestAnimationFrame(renderFrame)
        return
      }

      const width = canvas.clientWidth || window.innerWidth
      const height = canvas.clientHeight || window.innerHeight
      const preset = getPreset()

      if (style === 'circular') {
        drawCircular(ctx, analyser, width, height, preset)
      } else if (style === 'wave') {
        drawWave(ctx, analyser, width, height, preset)
      } else {
        drawBar(ctx, analyser, width, height, preset)
      }

      animFrameRef.current = requestAnimationFrame(renderFrame)
    }

    const startAudio = async () => {
      try {
        const preset = getPreset()
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
            channelCount: 1,
          },
        })

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }

        const AudioContextClass = window.AudioContext || window.webkitAudioContext
        const audioOptions = { latencyHint: 'interactive' }
        if (performanceMode === 'power_save') {
          audioOptions.sampleRate = 22050
        }
        const audioCtx = new AudioContextClass(audioOptions)
        const analyser = audioCtx.createAnalyser()
        analyser.fftSize = preset.fftSize
        analyser.smoothingTimeConstant = 0.72
        analyser.minDecibels = -90
        analyser.maxDecibels = -20

        const source = audioCtx.createMediaStreamSource(stream)
        source.connect(analyser)

        streamRef.current = stream
        audioCtxRef.current = audioCtx
        analyserRef.current = analyser
        freqDataRef.current = new Uint8Array(analyser.frequencyBinCount)
        timeDataRef.current = new Uint8Array(analyser.fftSize)
        frameStateRef.current.lastFrame = 0
        animFrameRef.current = requestAnimationFrame(renderFrame)
      } catch (err) {
        console.error('Microphone access failed:', err)
      }
    }

    const handleVisibility = () => {
      if (!document.hidden && audioCtxRef.current?.state === 'suspended') {
        audioCtxRef.current.resume().catch(() => {})
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)
    startAudio()

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('resize', resizeCanvas)
      stopAudio()
    }
  }, [
    color,
    drawBar,
    drawCircular,
    drawWave,
    fps,
    getPreset,
    performanceMode,
    renderScale,
    style,
  ])

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100vw',
        height: '100vh',
        display: 'block',
        background: '#000',
      }}
    />
  )
}

export default SoundVisualizer
