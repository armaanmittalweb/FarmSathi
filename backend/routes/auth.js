const express = require("express");
const router = express.Router();
const { registerFarmer, requestOtp, verifyOtp, getProfile } = require("../controllers/authController");
const { requireAuth } = require("../middleware/auth");

router.post("/register", registerFarmer);
router.post("/login", requestOtp);
router.post("/verify-otp", verifyOtp);
router.get("/profile", requireAuth, getProfile);

module.exports = router;
