const axios = require("axios");

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8001";

const client = axios.create({
  baseURL: AI_SERVICE_URL,
  timeout: 120000, // local LLM/Whisper inference on CPU can be slow
});

/**
 * Thin, typed wrapper around the ai-service FastAPI endpoints so the rest
 * of the backend never has to know the HTTP details or spawn Python itself.
 * See ai-service/README.md for the service contract.
 */
module.exports = {
  client,
  AI_SERVICE_URL,

  async chat({ message, language, farmerId, farmerProfileText }) {
    const { data } = await client.post("/chat", {
      message,
      language,
      farmer_id: farmerId || null,
      farmer_profile_text: farmerProfileText || null,
    });
    return data; // { reply }
  },

  async transcribe(filePath, language) {
    const FormData = require("form-data");
    const fs = require("fs");
    const form = new FormData();
    form.append("audio", fs.createReadStream(filePath));
    if (language) form.append("language", language);
    const { data } = await client.post("/transcribe", form, {
      headers: form.getHeaders(),
    });
    return data; // { text, language }
  },

  async speak(text, language) {
    const { data } = await client.post(
      "/speak",
      { text, language },
      { responseType: "arraybuffer" }
    );
    return Buffer.from(data); // raw WAV bytes
  },

  async analyzePlant(filePath) {
    const FormData = require("form-data");
    const fs = require("fs");
    const form = new FormData();
    form.append("image", fs.createReadStream(filePath));
    const { data } = await client.post("/analyze-plant", form, {
      headers: form.getHeaders(),
    });
    return data; // { disease, confidence, recommendation }
  },

  async analyzeSoil(fields) {
    const { data } = await client.post("/analyze-soil", fields);
    return data; // { crop, confidence, alternatives }
  },

  async upsertFarmerEmbedding(farmer) {
    const { data } = await client.post("/rag/farmer", farmer);
    return data;
  },
};
