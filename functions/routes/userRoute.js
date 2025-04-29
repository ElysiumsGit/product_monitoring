const express = require("express")
const { addUser, updateMyProfile  } = require("../controllers/userController");
const authenticateToken = require("../middleware/authenticateToken");

const router = express.Router();
router.post("/addUser/:currentUserId", addUser);
router.put("/updateMyProfile/:currentUserId", updateMyProfile);
// router.put("/:id/updateUser/:currentUserId", updateUser);

// router.post("/login", loginUser);
// router.put("/updatePassword/:id", updatePassword);

module.exports = router;