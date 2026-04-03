import { useEffect, useState } from 'react'
import WeatherDisplay from './WeatherDisplay'

function CounterDigit({ digit }) {
  return (
    <div className="counter-digit">
      <div className="counter-number">{digit}</div>
    </div>
  )
}

function ClockCounter({ showDate, showWeekday, weatherData }) {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const hours = String(time.getHours()).padStart(2, '0')
  const minutes = String(time.getMinutes()).padStart(2, '0')
  const seconds = String(time.getSeconds()).padStart(2, '0')
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']

  const digits = [
    ...hours.split(''),
    ':',
    ...minutes.split(''),
    ':',
    ...seconds.split(''),
  ]

  return (
    <div className="clock-container counter-clock-wrapper">
      <WeatherDisplay weatherData={weatherData} />
      <div className="counter-clock">
        {digits.map((d, i) =>
          d === ':' ? (
            <div key={i} className="counter-colon">
              <span>●</span>
              <span>●</span>
            </div>
          ) : (
            <CounterDigit key={i} digit={d} />
          )
        )}
      </div>
      {showDate && (
        <div className="clock-date" style={{ marginTop: '3vw' }}>
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

export default ClockCounter