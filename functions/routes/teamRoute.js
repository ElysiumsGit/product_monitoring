const express = require("express")
const { assignTeam, deleteTeam } = require("../controllers/teamController")

const router = express.Router();

router.post("/", assignTeam);
router.delete("/:id", deleteTeam);

module.exports = router;