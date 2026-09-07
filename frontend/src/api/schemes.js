import client from "./client";

export const getSchemes = (lang) => client.get("/api/schemes", { params: { lang } }).then((r) => r.data);
