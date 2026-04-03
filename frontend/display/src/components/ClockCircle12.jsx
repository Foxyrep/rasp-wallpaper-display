import { useEffect, useState } from 'react'
import WeatherDisplay from './WeatherDisplay'

function ClockCircle12({ showDate, showWeekday, weatherData }) {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const hours = time.getHours() % 12
  const minutes = time.getMinutes()
  const seconds = time.getSeconds()

  const hourAngle = (hours + minutes / 60) * 30
  const minuteAngle = (minutes + seconds / 60) * 6
  const secondAngle = seconds * 6

  const weekdays = ['日', '一', '二', '三', '四', '五', '六']

  // Clock face numbers and ticks
  const numbers = Array.from({ length: 12 }, (_, i) => i + 1)
  const ticks = Array.from({ length: 60 }, (_, i) => i)

  return (
    <div className="clock-container">
      <WeatherDisplay weatherData={weatherData} />
      <svg className="circle-clock-svg" viewBox="0 0 200 200">
        {/* Outer ring */}
        <circle className="clock-face" cx="100" cy="100" r="95" />

        {/* Tick marks */}
        {ticks.map((i) => {
          const angle = (i * 6 - 90) * (Math.PI / 180)
          const isHour = i % 5 === 0
          const innerR = isHour ? 80 : 85
          return (
            <line
              key={i}
              x1={100 + innerR * Math.cos(angle)}
              y1={100 + innerR * Math.sin(angle)}
              x2={100 + 90 * Math.cos(angle)}
              y2={100 + 90 * Math.sin(angle)}
              stroke="#fff"
              strokeWidth={isHour ? 2 : 0.5}
              opacity={isHour ? 1 : 0.4}
            />
          )
        })}

        {/* Numbers */}
        {numbers.map((n) => {
          const angle = ((n - 3) * 30) * (Math.PI / 180)
          return (
            <text
              key={n}
              className="clock-number"
              x={100 + 70 * Math.cos(angle)}
              y={100 + 70 * Math.sin(angle)}
            >
              {n}
            </text>
          )
        })}

        {/* Hour hand */}
        <line
          className="clock-hand hour-hand"
          x1="100" y1="100"
          x2={100 + 45 * Math.cos((hourAngle - 90) * (Math.PI / 180))}
          y2={100 + 45 * Math.sin((hourAngle - 90) * (Math.PI / 180))}
        />

        {/* Minute hand */}
        <line
          className="clock-hand minute-hand"
          x1="100" y1="100"
          x2={100 + 60 * Math.cos((minuteAngle - 90) * (Math.PI / 180))}
          y2={100 + 60 * Math.sin((minuteAngle - 90) * (Math.PI / 180))}
        />

        {/* Second hand */}
        <line
          className="clock-hand second-hand"
          x1="100" y1="100"
          x2={100 + 70 * Math.cos((secondAngle - 90) * (Math.PI / 180))}
          y2={100 + 70 * Math.sin((secondAngle - 90) * (Math.PI / 180))}
        />

        {/* Center dot */}
        <circle className="clock-center" cx="100" cy="100" r="4" />
      </svg>

      {showDate && (
        <div className="clock-date">
          {time.getFullYear()}年{time.getMonth() + 1}月{time.getDate()}日
        </div>
      )}
      {showWeekday && (
        <div className="clock-weekday">
          星期{weekdays[time.getDay()]}
        </div>
      )}
    </div>
  )
}

export default ClockCircle12