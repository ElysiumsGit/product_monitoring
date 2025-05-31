const express = require('express');
const { forgotPasswordController, submitVerificationCode, createNewPassword } = require('../controllers/forgotPasswordController');

const router = express.Router();

router.put("/password/update", forgotPasswordController);
router.put("/password/update/code", submitVerificationCode);
router.put("/password/update/new", createNewPassword);

module.exports = router;
