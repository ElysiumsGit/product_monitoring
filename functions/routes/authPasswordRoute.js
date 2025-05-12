const express = require("express");
const { updatePassword } = require("../controllers/authPasswordController");

const router = express.Router();

router.put("/update/:currentUserId", updatePassword);

module.exports = router;