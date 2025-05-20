const express = require("express");
const { updatePassword, getCode, submitCode } = require("../controllers/authPasswordController");

const router = express.Router();

router.post("/getCode", getCode);
// router.put("/resendCode", resendCode);
router.post("/submitCode", submitCode);
router.put("/update/:currentUserId", updatePassword);

module.exports = router;
