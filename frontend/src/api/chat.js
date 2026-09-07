import client, { API_URL } from "./client";

export const sendTextMessage = (message, language, farmerId) =>
  client.post("/chat", { message, language, farmer_id: farmerId }).then((r) => r.data);

export const sendAudioMessage = (audioBlob, language, farmerId) => {
  const form = new FormData();
  form.append("audio", audioBlob, "message.webm");
  form.append("language", language);
  if (farmerId) form.append("farmer_id", farmerId);
  return client
    .post("/chat", form, { headers: { "Content-Type": "multipart/form-data" } })
    .then((r) => r.data);
};

export const getChatHistory = (farmerId) => client.get(`/chat/history/${farmerId}`).then((r) => r.data);

export const resolveAudioUrl = (audioUrl) => (audioUrl ? `${API_URL}${audioUrl}` : null);
