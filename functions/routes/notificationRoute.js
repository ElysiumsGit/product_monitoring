const express = require("express");
const { deleteNotification } = require("../controllers/notificationController");

const router = express.Router();

router.delete("/:user_id/:notification_id", deleteNotification);

module.exports = router;