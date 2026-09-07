const axios = require("axios");

/**
 * GET /api/weather?lat=&lon=
 * Uses Open-Meteo — free, no API key, no rate-limit signup — so the app
 * never depends on a paid/keyed weather provider.
 */
exports.getWeather = async (req, res) => {
  const { lat, lon } = req.query;
  if (!lat || !lon) {
    return res.status(400).json({ error: "lat and lon query params are required." });
  }

  try {
    const { data } = await axios.get("https://api.open-meteo.com/v1/forecast", {
      params: {
        latitude: lat,
        longitude: lon,
        daily: "temperature_2m_max,temperature_2m_min,precipitation_sum,relative_humidity_2m_mean,weather_code",
        current: "temperature_2m,relative_humidity_2m,precipitation,weather_code",
        timezone: "auto",
        forecast_days: 7,
      },
      timeout: 10000,
    });

    res.json({
      current: data.current,
      daily: data.daily,
      units: { ...data.current_units, ...data.daily_units },
    });
  } catch (err) {
    console.error("Weather fetch failed:", err.message);
    res.status(502).json({ error: "Failed to fetch weather from Open-Meteo." });
  }
};
