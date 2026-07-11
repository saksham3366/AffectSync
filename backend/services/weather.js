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
    let query = "";
    if (lat && lon) {
      query = `${lat},${lon}`;
    } else {
      query = encodeURIComponent(city);
    }
    const url = `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${query}`;

    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok) {
      console.warn(`[Weather] API Error: ${data.error?.message || res.statusText}. Falling back to Mood-only.`);
      return null;
    }

    const tempC = data.current.temp_c;
    const condition = data.current.condition.text;
    const rain_mm = data.current.precip_mm || 0;
    
    const weatherType = classifyWeather(tempC, rain_mm, condition);

    const result = {
      temp: tempC,
      humidity: data.current.humidity,
      condition,
      icon: data.current.condition.icon.replace(/^\/\//, "https://"), // Ensure https
      city: data.location.name,
      type: weatherType
    };

    // Store in cache
    cache.set(cacheKey, { timestamp: Date.now(), data: result });
    
    return result;
  } catch (err) {
    console.error("[Weather] Failed to fetch weather:", err.message);
    return null;
  }
}

module.exports = {
  getWeather,
  classifyWeather
};
