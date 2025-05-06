const express = require("express")
const { addUser, updateMyProfile, updatePassword, loginUser  } = require("../controllers/userController");
const authenticateToken = require("../middleware/authenticateToken");
const multer = require("multer");

// const storage = multer.memoryStorage();
// const upload = multer({ storage: storage });

const router = express.Router();
router.post("/addUser/:currentUserId", addUser);
// router.post("/addUser/:currentUserId", upload.single('avatar'), addUser);
router.post("/login", loginUser);
router.put("/updateMyProfile/:currentUserId" , updateMyProfile);
router.put("/updatePassword/:currentUserId" , updatePassword);

module.exports = router;