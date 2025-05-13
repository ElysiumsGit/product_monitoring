const express = require("express");
const { deleteNotification, deleteAllNotifications } = require("../controllers/notificationController");

const router = express.Router();

router.delete("/delete/:currentUserId/:notification_id", deleteNotification);
router.delete("/deleteAll/:currentUserId", deleteAllNotifications);
// router.delete("/getNotification/:currentUserId", getNotification);

module.exports = router;