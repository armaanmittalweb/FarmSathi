const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const { analyzePlant, analyzeSoil } = require("../controllers/analysisController");

const plantDir = "uploads/plant";
const soilDir = "uploads/soil";
[plantDir, soilDir].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const plantStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, plantDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const uploadPlant = multer({ storage: plantStorage });

router.post("/analyze-plant", uploadPlant.single("plantImage"), analyzePlant);
router.post("/analyze-soil", express.json(), analyzeSoil);

module.exports = router;
