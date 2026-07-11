const express = require("express");
const { authMiddleware } = require("../middleware/auth");
const { getWeather } = require("../services/weather");

const router = express.Router();

// GET /api/weather?city=xxx  OR  ?lat=xx&lon=xx
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { city, lat, lon } = req.query;
    if (!city && !(lat && lon)) {
      return res.status(400).json({ success: false, message: "Provide city or lat/lon" });
    }
    const weather = await getWeather(city, lat ? Number(lat) : null, lon ? Number(lon) : null);
    if (!weather) {
      return res.json({ success: true, weather: null, message: "Weather unavailable" });
    }
    res.json({ success: true, weather });
  } catch (err) {
    console.error("[Weather Route] Error:", err.message);
    res.status(500).json({ success: false, message: "Weather fetch failed" });
  }
});

module.exports = router;
