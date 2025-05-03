const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const farmerDataPath = path.join(__dirname, "../data/farmers.json");

// Ensure data folder exists
if (!fs.existsSync(path.dirname(farmerDataPath))) {
  fs.mkdirSync(path.dirname(farmerDataPath), { recursive: true });
}

// Helper to read and write JSON
const loadFarmers = () => {
  if (!fs.existsSync(farmerDataPath)) return [];
  return JSON.parse(fs.readFileSync(farmerDataPath, "utf-8"));
};

const saveFarmers = (farmers) => {
  fs.writeFileSync(farmerDataPath, JSON.stringify(farmers, null, 2));
};

exports.registerFarmer = (req, res) => {
  const {
    name,
    language,
    age,
    farm_size,
    crop_type,
    location,
  } = req.body;

  const farmers = loadFarmers();

  const newFarmer = {
    id: Date.now().toString(),
    name: name || null,
    language: language || "en",
    age: age || null,
    farm_size: farm_size || null,
    crop_type: crop_type || null,
    location: location || null,
  };

  farmers.push(newFarmer);
  saveFarmers(farmers);

  // Optional: call Python script to update ChromaDB vector store
  const python = spawn("python3", ["./python-scripts/update_chroma.py", JSON.stringify(newFarmer)]);
  
  python.on("close", (code) => {
    if (code === 0) {
      res.json({
        message: "Farmer profile saved successfully",
        farmer_id: newFarmer.id,
      });
    } else {
      res.status(500).json({
        message: "Failed to update ChromaDB (Python script error)",
        farmer_id: newFarmer.id,
      });
    }
  });
};
