const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const farmerDataPath = path.join(__dirname, "../data/farmers.json");

const loadFarmers = () => {
  if (!fs.existsSync(farmerDataPath)) return [];
  return JSON.parse(fs.readFileSync(farmerDataPath, "utf-8"));
};

exports.handleChat = (req, res) => {
  const isAudio = req.file !== undefined;
  const input = isAudio ? req.file.path : req.body.message;
  const language = req.body.language || "en";
  const farmer_id = req.body.farmer_id;

  let farmer_profile = null;
  if (farmer_id) {
    const farmers = loadFarmers();
    farmer_profile = farmers.find((f) => f.id === farmer_id);
  }

  const args = [
    isAudio ? "--audio" : "--text",
    input,
    "--lang",
    language,
    "--profile",
    JSON.stringify(farmer_profile || {})
  ];

  const python = spawn("python3", ["./python-scripts/chatbot.py", ...args]);

  let response = "";
  python.stdout.on("data", (data) => {
    response += data.toString();
  });

  python.on("close", (code) => {
    if (code === 0) {
      const [reply, audioFile] = response.split("||"); // Custom delimiter for audio
      res.json({
        reply: reply.trim(),
        audio_url: audioFile?.trim() || null,
      });
    } else {
      res.status(500).json({ error: "Chatbot failed to respond." });
    }
  });
};
