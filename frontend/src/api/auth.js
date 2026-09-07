import client from "./client";

export const register = (profile) => client.post("/api/register", profile).then((r) => r.data);
export const requestOtp = (phone) => client.post("/api/login", { phone }).then((r) => r.data);
export const verifyOtp = (phone, otp) => client.post("/api/verify-otp", { phone, otp }).then((r) => r.data);
export const getProfile = () => client.get("/api/profile").then((r) => r.data);
