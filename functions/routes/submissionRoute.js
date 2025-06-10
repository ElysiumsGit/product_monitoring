const express = require("express")
const { addSubmission } = require("../controllers/submissionController");

const router = express.Router();
router.post('/add/:currentUserId', addSubmission);

module.exports = router;