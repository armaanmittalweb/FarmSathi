const express = require("express");
const router = express.Router();
const { listSchemes } = require("../controllers/schemesController");

router.get("/", listSchemes);

module.exports = router;
