const express = require("express");
const { updatePassword, getCode, submitCode } = require("../controllers/authPasswordController");

const router = express.Router();

router.get("/getCode/:currentUserId", getCode);
// router.put("/resendCode", resendCode);
// router.post("/submitCode/:currentUserId", submitCode);
router.put("/update/:currentUserId", updatePassword);

module.exports = router;
    