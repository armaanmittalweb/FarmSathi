const express = require("express");
const router = express.Router();
const multer = require("multer");
const { handleChat, getHistory } = require("../controllers/chatController");
const { optionalAuth } = require("../middleware/auth");

const upload = multer({ dest: "uploads/" });

router.post("/", optionalAuth, upload.single("audio"), handleChat);
router.get("/history/:farmerId", optionalAuth, getHistory);

module.exports = router;
