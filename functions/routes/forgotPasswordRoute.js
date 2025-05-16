const express = require('express');
const { forgotPasswordController, submitVerificationCode, createNewPassword } = require('../controllers/forgotPasswordController');

const router = express.Router();

router.put("/", forgotPasswordController);
router.put("/code", submitVerificationCode);
router.put("/createNewPassword", createNewPassword);

module.exports = router;