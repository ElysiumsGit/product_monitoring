const express = require("express")
const { addUser, updateMyProfile, updatePassword, getAllUsers, getUser, loginUser  } = require("../controllers/userController");
const authenticateToken = require("../middleware/authenticateToken");

const router = express.Router();
router.post("/addUser/:currentUserId" , addUser);
router.post("/login", loginUser);
router.put("/updateMyProfile/:currentUserId" , updateMyProfile);
router.put("/updatePassword/:currentUserId" , updatePassword);
router.get("/getAllUsers" ,getAllUsers);
router.get("/getUser/:id"  ,getUser);
// router.get("/getUser", getUserData);

module.exports = router;