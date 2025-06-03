const express = require("express")
const { assignTeam, updateTeam, deleteTeam } = require("../controllers/teamController")

const router = express.Router();

router.post("/add/:currentUserId", assignTeam);
router.put("/update/:currentUserId/:targetId", updateTeam);
router.delete("/delete/:currentUserId/:targetId", deleteTeam);

module.exports = router;