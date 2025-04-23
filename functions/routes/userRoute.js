const express = require("express")
const { addUser, updateUser, loginUser, updatePassword } = require("../controllers/userController");
const authenticateToken = require("../middleware/authenticateToken");

const router = express.Router();
router.post("/addUser/:userId", authenticateToken, addUser);
router.post("/login", loginUser);
router.put("/:id",authenticateToken , updateUser);
router.put("/updatePassword/:id", authenticateToken, updatePassword);

module.exports = router;