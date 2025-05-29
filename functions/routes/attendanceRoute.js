const express = require("express")
const { userAttendance, adminUpdateAttendance, updateAttendance } = require("../controllers/attendanceController")

const router = express.Router();
router.post('/add/:currentUserId', userAttendance);
router.post('/add/:currentUserId/:targetId', adminUpdateAttendance);
router.put('/update/:currentUserId/:targetId', updateAttendance);

module.exports = router;