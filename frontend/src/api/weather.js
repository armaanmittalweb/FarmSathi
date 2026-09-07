import client from "./client";

export const getWeather = (lat, lon) =>
  client.get("/api/weather", { params: { lat, lon } }).then((r) => r.data);
