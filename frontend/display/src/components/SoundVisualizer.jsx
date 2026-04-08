import { useEffect, useRef, useCallback } from 'react'

function SoundVisualizer({ style = 'bar', color = '#00ff88', sensitivity = 1.0 }) {
  const canvasRef = useRef(null)
  const audioCtxRef = useRef(null)
  const analyserRef = useRef(null)
  const streamRef = useRef(null)
  const animFrameRef = useRef(null)

  const drawTime = useCallback((ctx, canvas, x, y, fontSize) => {
    const now = new Date()
    const h = String(now.getHours()).padStart(2, '0')
    const m = String(now.getMinutes()).padStart(2, '0')
    const s = String(now.getSeconds()).padStart(2, '0')
    const timeStr = `${h}:${m}:${s}`

    ctx.save()
    ctx.font = `200 ${fontSize}px 'Segoe UI', sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = color === 'rainbow' ? '#ffffff55' : color + '55'
    ctx.fillText(timeStr, x, y)
    ctx.restore()
  }, [color])

  const getColor = useCallback((t, alpha) => {
    if (color !== 'rainbow') {
      return color + Math.round(alpha * 255).toString(16).padStart(2, '0')
    }
    // Rainbow: t is 0..1 position
    const hue = (t * 360) % 360
    return `hsla(${hue}, 100%, 55%, ${alpha})`
  }, [color])

  const getRainbowColor = useCallback((t) => {
    if (color !== 'rainbow') return color
    const hue = (t * 360) % 360
    return `hsl(${hue}, 100%, 55%)`
  }, [color])

  const drawBar = useCallback((analyser, canvas, ctx) => {
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    analyser.getByteFrequencyData(dataArray)

    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const barCount = 64
    const gap = 3
    const barWidth = (canvas.width - gap * (barCount - 1)) / barCount
    const step = Math.floor(bufferLength / barCount)

    for (let i = 0; i < barCount; i++) {
      let sum = 0
      for (let j = 0; j < step; j++) {
        sum += dataArray[i * step + j]
      }
      const avg = (sum / step) * sensitivity
      const barHeight = (avg / 255) * canvas.height * 0.85

      const x = i * (barWidth + gap)
      const y = canvas.height - barHeight

      if (color === 'rainbow') {
        const gradient = ctx.createLinearGradient(x, canvas.height, x, y)
        gradient.addColorStop(0, getColor(i / barCount, 1))
        gradient.addColorStop(1, getColor(i / barCount, 0.2))
        ctx.fillStyle = gradient
      } else {
        const gradient = ctx.createLinearGradient(x, canvas.height, x, y)
        gradient.addColorStop(0, color)
        gradient.addColorStop(1, color + '33')
        ctx.fillStyle = gradient
      }

      ctx.beginPath()
      const radius = Math.min(barWidth / 2, 4)
      ctx.moveTo(x + radius, y)
      ctx.lineTo(x + barWidth - radius, y)
      ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius)
      ctx.lineTo(x + barWidth, canvas.height)
      ctx.lineTo(x, canvas.height)
      ctx.lineTo(x, y + radius)
      ctx.quadraticCurveTo(x, y, x + radius, y)
      ctx.fill()
    }

    // Time at top center
    drawTime(ctx, canvas, canvas.width / 2, canvas.height * 0.12, canvas.height * 0.06)
  }, [color, sensitivity, drawTime])

  const drawCircular = useCallback((analyser, canvas, ctx) => {
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    analyser.getByteFrequencyData(dataArray)

    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const cx = canvas.width / 2
    const cy = canvas.height / 2
    const baseRadius = Math.min(cx, cy) * 0.25
    const maxRadius = Math.min(cx, cy) * 0.7
    const bars = 128
    const step = Math.floor(bufferLength / bars)

    for (let i = 0; i < bars; i++) {
      const angle = (i / bars) * Math.PI * 2 - Math.PI / 2
      let sum = 0
      for (let j = 0; j < step; j++) {
        sum += dataArray[i * step + j]
      }
      const avg = (sum / step) * sensitivity
      const barLen = (avg / 255) * (maxRadius - baseRadius)

      const x1 = cx + Math.cos(angle) * baseRadius
      const y1 = cy + Math.sin(angle) * baseRadius
      const x2 = cx + Math.cos(angle) * (baseRadius + barLen)
      const y2 = cy + Math.sin(angle) * (baseRadius + barLen)

      const alpha = 0.3 + (avg / 255) * 0.7
      ctx.strokeStyle = getColor(i / bars, alpha)
      ctx.lineWidth = Math.max(1, (Math.PI * 2 * baseRadius) / bars * 0.6)
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.stroke()
    }

    // Inner circle glow
    const glowGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseRadius)
    glowGradient.addColorStop(0, color === 'rainbow' ? 'rgba(255,255,255,0.13)' : color + '22')
    glowGradient.addColorStop(1, 'transparent')
    ctx.fillStyle = glowGradient
    ctx.beginPath()
    ctx.arc(cx, cy, baseRadius, 0, Math.PI * 2)
    ctx.fill()

    // Time at center of circle
    drawTime(ctx, canvas, cx, cy, canvas.height * 0.045)
  }, [color, sensitivity, drawTime])

  const drawWave = useCallback((analyser, canvas, ctx) => {
    const bufferLength = analyser.fftSize
    const dataArray = new Uint8Array(bufferLength)
    analyser.getByteTimeDomainData(dataArray)

    ctx.fillStyle = 'rgba(0, 0, 0, 0.08)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const centerY = canvas.height * 0.55
    const amplitude = canvas.height * 0.25

    // Draw 3 layers with different opacity
    const layers = [
      { offset: 0, alpha: 0.8, lineWidth: 3 },
      { offset: -0.02, alpha: 0.4, lineWidth: 2 },
      { offset: 0.02, alpha: 0.4, lineWidth: 2 },
    ]

    for (const layer of layers) {
      const sliceWidth = canvas.width / bufferLength
      let x = 0

      if (color === 'rainbow') {
        // Draw rainbow wave as segments
        for (let i = 0; i < bufferLength - 1; i++) {
          const v = (dataArray[i] / 128.0 - 1.0 + layer.offset) * sensitivity
          const y = centerY + v * amplitude
          const vNext = (dataArray[i + 1] / 128.0 - 1.0 + layer.offset) * sensitivity
          const yNext = centerY + vNext * amplitude

          ctx.beginPath()
          ctx.strokeStyle = getColor(i / bufferLength, layer.alpha)
          ctx.lineWidth = layer.lineWidth
          ctx.moveTo(x, y)
          ctx.lineTo(x + sliceWidth, yNext)
          ctx.stroke()
          x += sliceWidth
        }
      } else {
        ctx.beginPath()
        ctx.strokeStyle = color + Math.round(layer.alpha * 255).toString(16).padStart(2, '0')
        ctx.lineWidth = layer.lineWidth
        let lx = 0
        for (let i = 0; i < bufferLength; i++) {
          const v = (dataArray[i] / 128.0 - 1.0 + layer.offset) * sensitivity
          const y = centerY + v * amplitude
          if (i === 0) ctx.moveTo(lx, y)
          else ctx.lineTo(lx, y)
          lx += sliceWidth
        }
        ctx.stroke()
      }
    }

    // Glow effect on the main line
    const shadowColor = color === 'rainbow' ? '#ffffff' : color
    ctx.shadowColor = shadowColor
    ctx.shadowBlur = 15
    if (color === 'rainbow') {
      const sliceWidth = canvas.width / bufferLength
      let gx = 0
      for (let i = 0; i < bufferLength - 1; i++) {
        const v = (dataArray[i] / 128.0 - 1.0) * sensitivity
        const y = centerY + v * amplitude
        const vNext = (dataArray[i + 1] / 128.0 - 1.0) * sensitivity
        const yNext = centerY + vNext * amplitude
        ctx.beginPath()
        ctx.strokeStyle = getColor(i / bufferLength, 0.7)
        ctx.lineWidth = 2
        ctx.moveTo(gx, y)
        ctx.lineTo(gx + sliceWidth, yNext)
        ctx.stroke()
        gx += sliceWidth
      }
    } else {
      ctx.beginPath()
      ctx.strokeStyle = color + 'aa'
      ctx.lineWidth = 2
      let gx = 0
      for (let i = 0; i < bufferLength; i++) {
        const v = (dataArray[i] / 128.0 - 1.0) * sensitivity
        const y = centerY + v * amplitude
        if (i === 0) ctx.moveTo(gx, y)
        else ctx.lineTo(gx, y)
        gx += canvas.width / bufferLength
      }
      ctx.stroke()
    }
    ctx.shadowBlur = 0

    // Time at top center
    drawTime(ctx, canvas, canvas.width / 2, canvas.height * 0.12, canvas.height * 0.06)
  }, [color, sensitivity, drawTime])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    let cancelled = false

    const startAudio = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
          }
        })
        if (cancelled) {
          stream.getTracks().forEach(t => t.stop())
          return
        }
        streamRef.current = stream

        const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
        audioCtxRef.current = audioCtx

        const source = audioCtx.createMediaStreamSource(stream)
        const analyser = audioCtx.createAnalyser()
        analyser.fftSize = 2048
        analyser.smoothingTimeConstant = 0.8
        source.connect(analyser)
        analyserRef.current = analyser

        const draw = () => {
          if (cancelled) return
          animFrameRef.current = requestAnimationFrame(draw)

          switch (style) {
            case 'circular':
              drawCircular(analyser, canvas, ctx)
              break
            case 'wave':
              drawWave(analyser, canvas, ctx)
              break
            default:
              drawBar(analyser, canvas, ctx)
          }
        }
        draw()
      } catch (err) {
        console.error('Microphone access denied:', err)
        // Draw placeholder text
        ctx.fillStyle = '#333'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.fillStyle = color
        ctx.font = '3vw sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('请允许麦克风访问权限', canvas.width / 2, canvas.height / 2)
      }
    }

    startAudio()

    return () => {
      cancelled = true
      window.removeEventListener('resize', resizeCanvas)
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
      if (audioCtxRef.current) audioCtxRef.current.close()
      streamRef.current = null
      audioCtxRef.current = null
      analyserRef.current = null
    }
  }, [style, color, sensitivity, drawBar, drawCircular, drawWave])

  return (
    <div className="soundviz-container">
      <canvas ref={canvasRef} />
    </div>
  )
}

export default SoundVisualizer
