const aiService = require("../utils/aiService");

/**
 * POST /analyze-plant  (multipart, field "plantImage")
 * Proxies to ai-service's CNN classifier instead of spawning a
 * (nonexistent) python-scripts/analyze_plant.py per request.
 */
exports.analyzePlant = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "plantImage file is required." });
  try {
    const result = await aiService.analyzePlant(req.file.path);
    res.json(result);
  } catch (err) {
    console.error("Plant analysis failed:", err.message);
    res.status(502).json({ error: "ai-service plant analysis failed. Is the model trained and loaded?" });
  }
};

/**
 * POST /analyze-soil
 * Accepts JSON tabular soil values: { n, p, k, temperature, humidity, ph, rainfall }.
 * This is the reliable path (see ROADMAP.md phase 4) — the RandomForest
 * model trained on the open Crop Recommendation Dataset works on exactly
 * these fields.
 */
exports.analyzeSoil = async (req, res) => {
  const { n, p, k, temperature, humidity, ph, rainfall } = req.body;
  const missing = ["n", "p", "k", "temperature", "humidity", "ph", "rainfall"].filter(
    (key) => req.body[key] === undefined || req.body[key] === null || req.body[key] === ""
  );
  if (missing.length) {
    return res.status(400).json({ error: `Missing required fields: ${missing.join(", ")}` });
  }

  try {
    const result = await aiService.analyzeSoil({
      n: Number(n),
      p: Number(p),
      k: Number(k),
      temperature: Number(temperature),
      humidity: Number(humidity),
      ph: Number(ph),
      rainfall: Number(rainfall),
    });
    res.json(result);
  } catch (err) {
    console.error("Soil analysis failed:", err.message);
    res.status(502).json({ error: "ai-service soil analysis failed. Is the model trained and loaded?" });
  }
};
