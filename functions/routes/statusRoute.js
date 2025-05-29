const express = require("express");
const { setStatus } = require("../controllers/statusController");

const router = express.Router();
router.put("/update/:currentUserId/:targetId", setStatus);

module.exports = router;