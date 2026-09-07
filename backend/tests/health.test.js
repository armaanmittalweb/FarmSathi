const request = require("supertest");
const { app } = require("../server");

describe("GET /health", () => {
  it("returns ok without needing a database connection", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });
});

describe("GET /api/schemes", () => {
  it("returns the curated schemes list localized to the requested language", async () => {
    const res = await request(app).get("/api/schemes").query({ lang: "hi" });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty("name");
    expect(res.body[0]).toHaveProperty("official_link");
  });
});
