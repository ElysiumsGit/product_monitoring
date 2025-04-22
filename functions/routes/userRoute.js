const express = require("express")
const { addUser, updateUser, loginUser } = require("../controllers/userController");
const authenticateToken = require("../middleware/authenticateToken");

const router = express.Router();
router.post("/", authenticateToken, addUser);
router.post("/login", loginUser);
router.put("/:id" , updateUser);

module.exports = router;