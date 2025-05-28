const express = require("express")
const { addUser, updateMyProfile, loginUser, userAttendance  } = require("../controllers/userController");
const authenticateToken = require("../middleware/authenticateToken");

const router = express.Router();
router.post("/add/:currentUserId", addUser);
router.post("/login", loginUser);
router.put("/update/:currentUserId" , updateMyProfile);
router.post('/attendance/:currentUserId', userAttendance);

module.exports = router;