const express = require("express");
const { assignStoreSchedule, getSchedule } = require("../controllers/assignScheduleController");

const router = express.Router();
router.post("/assignSchedule", assignStoreSchedule);
router.get("/getSchedule/:date", getSchedule);

module.exports = router;