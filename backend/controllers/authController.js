const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const Farmer = require("../models/Farmer");
const aiService = require("../utils/aiService");

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const isDevMode = () => (process.env.DEV_MODE || "true").toLowerCase() === "true";

function generateOtp() {
  return crypto.randomInt(100000, 999999).toString();
}

function signToken(farmer) {
  return jwt.sign({ id: farmer._id.toString(), phone: farmer.phone }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
}

/**
 * POST /api/register
 * Creates (or updates, if the phone already exists) a farmer profile and
 * sends an OTP to log them in. No password is ever stored — this matches
 * the README's "phone number based easy authentication".
 */
exports.registerFarmer = async (req, res) => {
  try {
    const { phone, name, language, age, farm_size, crop_type, location } = req.body;

    if (!phone) {
      return res.status(400).json({ error: "phone is required." });
    }

    let farmer = await Farmer.findOne({ phone });
    if (!farmer) {
      farmer = new Farmer({ phone });
    }

    if (name !== undefined) farmer.name = name;
    if (language !== undefined) farmer.language = language;
    if (age !== undefined) farmer.age = age;
    if (farm_size !== undefined) farmer.farm_size = farm_size;
    if (crop_type !== undefined) farmer.crop_type = crop_type;
    if (location !== undefined) farmer.location = location;

    await farmer.save();

    // Best-effort: keep the RAG vector store in sync with the profile so
    // the chatbot can ground answers in it. Never block registration on this.
    aiService
      .upsertFarmerEmbedding({
        id: farmer._id.toString(),
        name: farmer.name,
        language: farmer.language,
        age: farmer.age,
        farm_size: farmer.farm_size,
        crop_type: farmer.crop_type,
        location: farmer.location,
      })
      .catch((err) => console.error("ai-service embedding sync failed:", err.message));

    res.json({
      message: "Farmer profile saved successfully",
      farmer_id: farmer._id,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: "A farmer with this phone number already exists." });
    }
    console.error(err);
    res.status(500).json({ error: "Failed to save farmer profile." });
  }
};

/**
 * POST /api/login
 * Body: { phone }
 * Issues a fresh OTP. In DEV_MODE (default, no SMS provider configured) the
 * OTP is logged to the server console and also returned in the response so
 * the app is fully usable without any paid SMS service.
 */
exports.requestOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: "phone is required." });

    const farmer = await Farmer.findOne({ phone });
    if (!farmer) {
      return res.status(404).json({ error: "No account for this phone number. Register first." });
    }

    const otp = generateOtp();
    farmer.otp = otp;
    farmer.otpExpiresAt = new Date(Date.now() + OTP_TTL_MS);
    await farmer.save();

    console.log(`[DEV_MODE OTP] ${phone} -> ${otp} (expires in 5 min)`);

    const response = { message: "OTP generated." };
    if (isDevMode()) {
      response.dev_otp = otp; // never do this with a real SMS provider wired in
    }
    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate OTP." });
  }
};

/**
 * POST /api/verify-otp
 * Body: { phone, otp }
 * Verifies the OTP and returns a JWT.
 */
exports.verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) return res.status(400).json({ error: "phone and otp are required." });

    const farmer = await Farmer.findOne({ phone }).select("+otp +otpExpiresAt");
    if (!farmer || !farmer.otp || !farmer.otpExpiresAt) {
      return res.status(401).json({ error: "No OTP requested for this number." });
    }
    if (farmer.otpExpiresAt < new Date()) {
      return res.status(401).json({ error: "OTP expired. Request a new one." });
    }
    if (farmer.otp !== otp) {
      return res.status(401).json({ error: "Incorrect OTP." });
    }

    farmer.otp = null;
    farmer.otpExpiresAt = null;
    await farmer.save();

    const token = signToken(farmer);
    res.json({ token, farmer: { id: farmer._id, name: farmer.name, phone: farmer.phone, language: farmer.language } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to verify OTP." });
  }
};

/**
 * GET /api/profile — requires auth.
 */
exports.getProfile = async (req, res) => {
  const farmer = await Farmer.findById(req.farmer.id);
  if (!farmer) return res.status(404).json({ error: "Farmer not found." });
  res.json(farmer);
};
