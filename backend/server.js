const express = require("express");
const multer = require("multer");
const cors = require("cors");
const { spawn } = require("child_process");
const path = require("path");  // 
const chatRoutes = require("./routes/chat");
const authRoutes = require("./routes/auth");

const app = express();
app.use("/api", authRoutes); // Register auth routes under /api
app.use(cors());
app.use(express.json());
app.use("/chat", chatRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Setup storage for soil and plant images
const soilStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/soil"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const plantStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/plant"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});

const uploadSoil = multer({ storage: soilStorage });
const uploadPlant = multer({ storage: plantStorage });

/**
 * POST /analyze-soil
 * Receives: Soil Health Card Image
 * Returns: Suitable crops
 */
app.post("/analyze-soil", uploadSoil.single("soilImage"), (req, res) => {
  const filePath = req.file.path;

  const py = spawn("python3", ["python-scripts/analyze_soil.py", filePath]);

  let result = "";
  py.stdout.on("data", (data) => {
    result += data.toString();
  });

  py.stderr.on("data", (data) => {
    console.error("Python error:", data.toString());
  });

  py.on("close", (code) => {
    res.json({ crops: result.trim() });
  });
});

/**
 * POST /analyze-plant
 * Receives: Plant/Crop Image
 * Returns: Crop health status
 */
app.post("/analyze-plant", uploadPlant.single("plantImage"), (req, res) => {
  const filePath = req.file.path;

  const py = spawn("python3", ["python-scripts/analyze_plant.py", filePath]);

  let result = "";
  py.stdout.on("data", (data) => {
    result += data.toString();
  });

  py.stderr.on("data", (data) => {
    console.error("Python error:", data.toString());
  });

  py.on("close", (code) => {
    res.json({ health: result.trim() });
  });
});
const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
