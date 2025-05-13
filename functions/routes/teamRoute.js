const express = require("express")
const { assignTeam, updateTeam, deleteTeam } = require("../controllers/teamController")

const router = express.Router();

router.post("/add/:currentUserId", assignTeam);
// router.get("/getTeam/:teamId", getUsersByTeam);
router.put("/update/:teamId/:currentUserId", updateTeam);
router.put("/delete/:teamId/:currentUserId", deleteTeam);

module.exports = router;