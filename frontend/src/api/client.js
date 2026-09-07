import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const client = axios.create({ baseURL: API_URL, timeout: 60000 });

client.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem("farmsathi_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch {
    // localStorage unavailable (e.g. private browsing) — proceed unauthenticated
  }
  return config;
});

export default client;
export { API_URL };
