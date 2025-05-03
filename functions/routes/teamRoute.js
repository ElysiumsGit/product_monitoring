const express = require("express")
const { assignTeam, updateTeam, deleteTeam } = require("../controllers/teamController")

const router = express.Router();

router.post("/addTeam/:currentUserId", assignTeam);
// router.get("/getTeam/:teamId", getUsersByTeam);
router.put("/updateTeam/:teamId/:currentUserId", updateTeam);
router.put("/deleteTeam/:teamId/:currentUserId", deleteTeam);

module.exports = router;