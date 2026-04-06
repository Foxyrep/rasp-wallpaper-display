import { useEffect, useState } from 'react'

function ClockDigital24({ showDate, showWeekday }) {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const hours = String(time.getHours()).padStart(2, '0')
  const minutes = String(time.getMinutes()).padStart(2, '0')
  const seconds = String(time.getSeconds()).padStart(2, '0')
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']

  return (
    <div className="clock-container">
      <div className="digital-clock">
        <div className="digital-time">
          {hours}:{minutes}:{seconds}
        </div>
        {(showDate || showWeekday) && (
          <div className="digital-date">
            {showDate && `${time.getFullYear()}/${time.getMonth() + 1}/${time.getDate()}`}
            {showDate && showWeekday && ' '}
            {showWeekday && `星期${weekdays[time.getDay()]}`}
          </div>
        )}
      </div>
    </div>
  )
}

export default ClockDigital24