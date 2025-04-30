const express = require("express")
const { assignTeam, getUsersByTeam, updateTeam, deleteTeam } = require("../controllers/teamController")

const router = express.Router();

router.post("/addTeam/:currentUserId", assignTeam);
router.get("/getTeam/:teamId", getUsersByTeam);
router.put("/updateTeam/:id/:currentUserId", updateTeam);
router.delete("/deleteTeam/:id", deleteTeam);

module.exports = router;