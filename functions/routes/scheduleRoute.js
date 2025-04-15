const express = require("express");
const { submitScheduleStore } = require("../controllers/scheduleController");

const router = express.Router();

router.post("/", submitScheduleStore);

module.exports = router;