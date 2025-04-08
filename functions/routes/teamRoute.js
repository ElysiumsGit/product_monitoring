const express = require("express")
const { assignTeam } = require("../controllers/teamController")

const router = express.Router();

router.post("/", assignTeam);

module.exports = router;