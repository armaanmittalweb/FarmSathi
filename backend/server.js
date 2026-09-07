require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const chatRoutes = require("./routes/chat");
const weatherRoutes = require("./routes/weather");
const schemesRoutes = require("./routes/schemes");
const analysisRoutes = require("./routes/analysis");

const app = express();

const corsOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173").split(",");
app.use(cors({ origin: corsOrigins }));
app.use(express.json());

const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use("/uploads", express.static(uploadsDir));

app.use("/api", authRoutes);
app.use("/api/weather", weatherRoutes);
app.use("/api/schemes", schemesRoutes);
app.use("/chat", chatRoutes);
// analysisRoutes mounts both /analyze-soil and /analyze-plant at the root,
// matching the paths the original server.js exposed.
app.use("/", analysisRoutes);

app.get("/health", (req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();
  app.listen(PORT, () => console.log(`FarmSaathi backend running on port ${PORT}`));
}

// Only connect to Mongo and start listening when this file is run directly
// (`node server.js` / `npm start`) — not when it's `require()`d by tests,
// which want the bare `app` to mount their own test database.
if (require.main === module) {
  start();
}

module.exports = { app, start };
