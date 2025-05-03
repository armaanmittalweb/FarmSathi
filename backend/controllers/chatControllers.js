const { spawn } = require("child_process");
const path = require("path");

exports.handleChat = (req, res) => {
  const { chatbot_type, language, input_type, message } = req.body;

  let pythonScript = "python-scripts/main_pipeline.py";
  let args = [chatbot_type, language];

  if (input_type === "text") {
    args.push("--text", message);
  } else if (req.file) {
    const audioPath = path.join(__dirname, "..", req.file.path);
    args.push("--audio", audioPath);
  } else {
    return res.status(400).json({ error: "Invalid input" });
  }

  const process = spawn("python3", [pythonScript, ...args]);

  let result = "";
  process.stdout.on("data", data => {
    result += data.toString();
  });

  process.stderr.on("data", err => {
    console.error("Python error:", err.toString());
  });

  process.on("close", code => {
    if (code !== 0) {
      return res.status(500).json({ error: "Python script failed" });
    }
    res.json({ reply: result.trim() });
  });
};
