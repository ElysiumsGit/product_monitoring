const express = require("express");
const { deleteNotification, deleteAllNotifications, getNotification } = require("../controllers/notificationController");

const router = express.Router();

router.delete("/deleteNotification/:currentUserId/:notification_id", deleteNotification);
router.delete("/deleteAllNotification/:currentUserId", deleteAllNotifications);
router.delete("/getNotification/:currentUserId", getNotification);

module.exports = router;