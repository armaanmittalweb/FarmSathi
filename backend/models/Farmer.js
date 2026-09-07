const mongoose = require("mongoose");

const farmerSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true, unique: true, index: true },
    name: { type: String, default: null },
    language: { type: String, enum: ["en", "hi", "pa"], default: "en" },
    age: { type: Number, default: null },
    farm_size: { type: Number, default: null }, // in acres
    crop_type: { type: String, default: null },
    location: {
      state: { type: String, default: null },
      district: { type: String, default: null },
      lat: { type: Number, default: null },
      lon: { type: Number, default: null },
    },
    // Short-lived OTP used only when DEV_MODE / no SMS provider is configured.
    otp: { type: String, select: false, default: null },
    otpExpiresAt: { type: Date, select: false, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Farmer", farmerSchema);
