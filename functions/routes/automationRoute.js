const express = require("express");
const { automationController } = require("../controllers/automationController");

const router = express.Router();

router.post("/", automationController);

module.exports = router;