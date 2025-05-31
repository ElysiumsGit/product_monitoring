const express = require("express")
const { addUser, updateMyProfile, loginUser, updateUser, deleteUser  } = require("../controllers/userController");
const authenticateToken = require("../middleware/authenticateToken");

const router = express.Router();
router.post("/add/:currentUserId", addUser);
router.post("/login", loginUser);
router.put("/update/:currentUserId" , updateMyProfile);
router.put("/update/:currentUserId/:targetId" , updateUser);
router.put("/delete/:currentUserId/:targetId" , deleteUser);

module.exports = router;