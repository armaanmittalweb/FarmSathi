import client from "./client";

export const analyzePlant = (file) => {
  const form = new FormData();
  form.append("plantImage", file);
  return client.post("/analyze-plant", form, { headers: { "Content-Type": "multipart/form-data" } }).then((r) => r.data);
};

export const analyzeSoil = (fields) => client.post("/analyze-soil", fields).then((r) => r.data);
