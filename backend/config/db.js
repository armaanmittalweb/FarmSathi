const mongoose = require("mongoose");

async function connectDB() {
  const uri = process.env.MONGO_URI || "mongodb://localhost:27017/farmsathi";
  try {
    await mongoose.connect(uri);
    console.log(`MongoDB connected: ${uri}`);
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    console.error(
      "Is MongoDB running locally? Install MongoDB Community Server or " +
        "point MONGO_URI at a reachable instance (see backend/.env.example)."
    );
    process.exit(1);
  }
}

module.exports = connectDB;
