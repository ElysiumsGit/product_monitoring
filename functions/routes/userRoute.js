const express = require("express")
const { addUser, updateUser, loginUser } = require("../controllers/userController");

const router = express.Router();
router.post("/", addUser);
router.post("/login", loginUser);
router.put("/:id", updateUser);

module.exports = router;