const express = require("express");
const { readNotification, readAllNotifications } = require("../controllers/notificationController");
const authenticateToken = require("../middleware/authenticateToken");

const router = express.Router();

// router.delete("/delete/:currentUserId/:notification_id", deleteNotification);
// router.delete("/deleteAll/:currentUserId", deleteAllNotifications);
// router.delete("/getNotification/:currentUserId", getNotification);
// router.put('/delete/:notificationId/:currentUserId', deleteNotification);
// router.put('/delete/:currentUserId', deleteAllNotification);

router.get('/read/:currentUserId/:notificationId',  readNotification);
router.get('/readAllNotification/:currentUserId', readAllNotifications);

module.exports = router;