const express = require("express");
const { deleteNotification, deleteAllNotification } = require("../controllers/notificationController");

const router = express.Router();

// router.delete("/delete/:currentUserId/:notification_id", deleteNotification);
// router.delete("/deleteAll/:currentUserId", deleteAllNotifications);
// router.delete("/getNotification/:currentUserId", getNotification);
router.put('/delete/:notificationId/:currentUserId', deleteNotification);
router.put('/delete/:currentUserId', deleteAllNotification);

module.exports = router;