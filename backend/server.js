const express = require("express");
const cors = require("cors");
const chatRoutes = require("./routes/chat");
const authRoutes = require("./routes/auth");

const app = express();
app.use("/api", authRoutes); // Register auth routes under /api
app.use(cors());
app.use(express.json());
app.use("/chat", chatRoutes);

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
