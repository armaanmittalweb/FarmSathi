const mongoose = require("mongoose");

const chatHistorySchema = new mongoose.Schema(
  {
    farmer: { type: mongoose.Schema.Types.ObjectId, ref: "Farmer", required: true, index: true },
    role: { type: String, enum: ["user", "assistant"], required: true },
    message: { type: String, required: true },
    language: { type: String, default: "en" },
    audioUrl: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ChatHistory", chatHistorySchema);
