const express = require("express");
const router = express.Router();
const { registerFarmer } = require("../controllers/authController");

router.post("/register", registerFarmer);

module.exports = router;
