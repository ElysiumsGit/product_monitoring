const express = require("express")
const { addUser, updateMyProfile, loginUser, userAttendance  } = require("../controllers/userController");
const authenticateToken = require("../middleware/authenticateToken");
const multer = require("multer");
const { auth } = require("firebase-admin");
const { resendCode } = require("../controllers/authPasswordController");

// const storage = multer.memoryStorage();
// const upload = multer({ storage: storage });

const router = express.Router();
router.post("/add/:currentUserId", addUser);
router.post("/login", loginUser);
router.put("/update/:currentUserId" , updateMyProfile);
router.post('/attendance/:currentUserId', userAttendance);



module.exports = router;