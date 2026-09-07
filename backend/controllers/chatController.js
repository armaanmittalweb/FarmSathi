const fs = require("fs");
const path = require("path");
const Farmer = require("../models/Farmer");
const ChatHistory = require("../models/ChatHistory");
const aiService = require("../utils/aiService");

const AUDIO_DIR = path.join(__dirname, "../uploads/audio");
if (!fs.existsSync(AUDIO_DIR)) fs.mkdirSync(AUDIO_DIR, { recursive: true });

function farmerProfileToText(farmer) {
  if (!farmer) return null;
  const parts = [
    farmer.name && `name: ${farmer.name}`,
    farmer.age && `age: ${farmer.age}`,
    farmer.farm_size && `farm size: ${farmer.farm_size} acres`,
    farmer.crop_type && `grows: ${farmer.crop_type}`,
    farmer.location?.state && `state: ${farmer.location.state}`,
    farmer.location?.district && `district: ${farmer.location.district}`,
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : null;
}

/**
 * POST /chat
 * multipart if voice (field "audio"), else JSON { message, language, farmer_id }.
 * Pipeline: [transcribe if audio] -> /chat (RAG+LLM) -> [speak if audio requested]
 */
exports.handleChat = async (req, res) => {
  try {
    const isAudio = req.file !== undefined;
    const language = req.body.language || "en";
    const farmerId = req.body.farmer_id || req.farmer?.id || null;

    let farmer = null;
    if (farmerId) {
      farmer = await Farmer.findById(farmerId).catch(() => null);
    }

    let userText = req.body.message;
    if (isAudio) {
      const transcription = await aiService.transcribe(req.file.path, language);
      userText = transcription.text;
    }

    if (!userText || !userText.trim()) {
      return res.status(400).json({ error: "No message text (or transcribable audio) provided." });
    }

    const { reply } = await aiService.chat({
      message: userText,
      language,
      farmerId,
      farmerProfileText: farmerProfileToText(farmer),
    });

    let audioUrl = null;
    if (isAudio) {
      // Only synthesize speech back when the user spoke to us — text chats
      // get a text reply, matching the existing frontend contract.
      const wavBuffer = await aiService.speak(reply, language);
      const fileName = `${Date.now()}-reply.wav`;
      fs.writeFileSync(path.join(AUDIO_DIR, fileName), wavBuffer);
      audioUrl = `/uploads/audio/${fileName}`;
    }

    if (farmerId) {
      await ChatHistory.insertMany([
        { farmer: farmerId, role: "user", message: userText, language },
        { farmer: farmerId, role: "assistant", message: reply, language, audioUrl },
      ]).catch((err) => console.error("Failed to save chat history:", err.message));
    }

    res.json({ reply, audio_url: audioUrl, transcript: isAudio ? userText : undefined });
  } catch (err) {
    console.error("Chat failed:", err.message);
    res.status(500).json({ error: "Chatbot failed to respond. Is ai-service running?" });
  }
};

/**
 * GET /chat/history/:farmerId — requires auth in practice (mounted with optionalAuth).
 */
exports.getHistory = async (req, res) => {
  const { farmerId } = req.params;
  const history = await ChatHistory.find({ farmer: farmerId }).sort({ createdAt: 1 }).limit(200);
  res.json(history);
};
