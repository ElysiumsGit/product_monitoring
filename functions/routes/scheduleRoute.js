const express = require("express");
const { addSchedule } = require("../controllers/scheduleController");

const router = express.Router();

router.post("/:user_id/:store_id/:inventory_id", addSchedule);

module.exports = router;