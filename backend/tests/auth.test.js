// Set before requiring the app so authController/jsonwebtoken pick it up.
process.env.JWT_SECRET = "test-secret";
process.env.DEV_MODE = "true";

const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const { app } = require("../server");
const Farmer = require("../models/Farmer");

let mongod;

// NOTE: mongodb-memory-server downloads a real mongod binary the first time
// it runs (cached afterwards). That download needs internet access once —
// if this suite hangs/fails offline, that's why.
jest.setTimeout(60000);

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterEach(async () => {
  await Farmer.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

describe("phone + OTP auth flow", () => {
  it("registers, requests an OTP, and verifies it to get a JWT", async () => {
    const phone = "9999999999";

    const registerRes = await request(app).post("/api/register").send({ phone, name: "Test Farmer" });
    expect(registerRes.status).toBe(200);
    expect(registerRes.body.farmer_id).toBeTruthy();

    const otpRes = await request(app).post("/api/login").send({ phone });
    expect(otpRes.status).toBe(200);
    expect(otpRes.body.dev_otp).toMatch(/^\d{6}$/); // only present because DEV_MODE=true

    const verifyRes = await request(app).post("/api/verify-otp").send({ phone, otp: otpRes.body.dev_otp });
    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.token).toBeTruthy();
    expect(verifyRes.body.farmer.phone).toBe(phone);

    const profileRes = await request(app)
      .get("/api/profile")
      .set("Authorization", `Bearer ${verifyRes.body.token}`);
    expect(profileRes.status).toBe(200);
    expect(profileRes.body.name).toBe("Test Farmer");
  });

  it("rejects an incorrect OTP", async () => {
    const phone = "8888888888";
    await request(app).post("/api/register").send({ phone });
    await request(app).post("/api/login").send({ phone });

    const verifyRes = await request(app).post("/api/verify-otp").send({ phone, otp: "000000" });
    expect(verifyRes.status).toBe(401);
  });

  it("rejects unauthenticated profile access", async () => {
    const res = await request(app).get("/api/profile");
    expect(res.status).toBe(401);
  });
});
