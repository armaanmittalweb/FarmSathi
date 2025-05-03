const express = require("express");
const router = express.Router();
const multer = require("multer");
const { handleChat } = require("../controllers/chatController");

const upload = multer({ dest: "uploads/" });

router.post("/", upload.single("audio"), handleChat);

module.exports = router;
