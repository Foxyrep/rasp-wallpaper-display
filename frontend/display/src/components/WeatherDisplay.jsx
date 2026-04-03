const WEATHER_ICONS = {
  '晴': '☀️',
  '多云': '⛅',
  '阴': '☁️',
  '小雨': '🌧️',
  '中雨': '🌧️',
  '大雨': '🌧️',
  '暴雨': '⛈️',
  '雷阵雨': '⛈️',
  '阵雨': '🌦️',
  '雨': '🌧️',
  '小雪': '🌨️',
  '中雪': '🌨️',
  '大雪': '❄️',
  '暴雪': '❄️',
  '雪': '🌨️',
  '雾': '🌫️',
  '霾': '🌫️',
  '风': '💨',
}

function getWeatherIcon(weather) {
  for (const [key, icon] of Object.entries(WEATHER_ICONS)) {
    if (weather.includes(key)) return icon
  }
  return '🌤️'
}

function WeatherDisplay({ weatherData }) {
  if (!weatherData?.enabled || !weatherData?.list?.length) return null

  return (
    <div className="weather-container">
      {weatherData.list.map((day, i) => (
        <div key={i} className="weather-day">
          <span className="weather-day-label">{day.label}</span>
          <span className="weather-icon">{getWeatherIcon(day.weather)}</span>
          <span className="weather-text">{day.weather}</span>
          {day.temp ? (
            <span className="weather-temp">{day.temp}°C</span>
          ) : (
            <span className="weather-temp">{day.temp_min}°~{day.temp_max}°</span>
          )}
        </div>
      ))}
    </div>
  )
}

export default WeatherDisplay