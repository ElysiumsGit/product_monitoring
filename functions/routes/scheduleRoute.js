const express = require("express");
const { assignStoreSchedule } = require("../controllers/assignScheduleController");

const router = express.Router();
router.post("/add/:currentUserId/:targetId", assignStoreSchedule);
// router.get("/getSchedule/:date", getSchedulesByDate);

module.exports = router;