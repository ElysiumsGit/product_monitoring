const express = require("express");
const { updatePassword, getCode, submitCode } = require("../controllers/authPasswordController");

const router = express.Router();

router.put("/getCode", getCode);
router.put("/submitCode/:currentUserId", submitCode);
router.put("/update/:currentUserId", updatePassword);

module.exports = router;