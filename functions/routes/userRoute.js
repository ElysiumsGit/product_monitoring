const express = require("express")
const { addUser, updateUser, loginUser, updatePassword, getAllUsers } = require("../controllers/userController");
const authenticateToken = require("../middleware/authenticateToken");

const router = express.Router();
router.post("/addUser/:currentUserId", addUser);
router.post("/login", loginUser);
router.put("/:id/updateUser/:currentUserId", updateUser);
router.put("/updatePassword/:id", updatePassword);

module.exports = router;