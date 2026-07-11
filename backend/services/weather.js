const fetch = require("node-fetch");

const cache = new Map();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

function classifyWeather(tempC, rain_mm, condition) {
  const c = (condition || "").toLowerCase();

  if (rain_mm > 0 || c.includes("rain") || c.includes("storm") || c.includes("drizzle")) {
    return "RAINY";
  }
  if (tempC >= 32) {
    return "HOT";
  }
  if (tempC <= 16) {
    return "COLD";
  }
  return "PLEASANT";
}

async function getWeather(city, lat = null, lon = null) {
  const apiKey = process.env.WEATHER_API_KEY;
  if (!apiKey || apiKey === "your_openweather_api_key") {
    console.warn("[Weather] WEATHER_API_KEY not set or invalid. Falling back to Mood-only.");
    return null;
  }

  // Generate cache key
  const cacheKey = (lat && lon) ? `${lat},${lon}` : city?.toLowerCase();
  if (!cacheKey) return null;

  // Check cache
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    let url = "";
    if (lat && lon) {
      url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    } else {
      url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;
    }

    const res = await fetch(url);
    const data = await res.json();

    if (data.cod !== 200) {
      console.warn(`[Weather] API Error: ${data.message}. Falling back to mock data for UI testing.`);
      return {
        temp: 22,
        humidity: 55,
        condition: 'Clear',
        icon: '01d',
        city: city || 'Your Location',
        type: 'PLEASANT'
      };
    }

    const tempC = data.main.temp;
    const condition = data.weather[0].main;
    const rain_mm = data.rain ? (data.rain["1h"] || 0) : 0;
    
    const weatherType = classifyWeather(tempC, rain_mm, condition);

    const result = {
      temp: tempC,
      humidity: data.main.humidity,
      condition,
      icon: data.weather[0].icon,
      city: data.name,
      type: weatherType
    };

    // Store in cache
    cache.set(cacheKey, { timestamp: Date.now(), data: result });
    
    return result;
  } catch (err) {
    console.error("[Weather] Failed to fetch weather:", err.message);
    return {
      temp: 22,
      humidity: 55,
      condition: 'Clear',
      icon: '01d',
      city: city || 'Your Location',
      type: 'PLEASANT'
    };
  }
}

module.exports = {
  getWeather,
  classifyWeather
};
