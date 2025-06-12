const express = require("express");
const { addGroup, updateGroup, deleteGroup } = require("../controllers/groupController");

const router = express.Router();

router.post("/add/:currentUserId", addGroup);
router.put("/update/:currentUserId/:targetId", updateGroup);
router.delete("/delete/:currentUserId/:targetId", deleteGroup);

module.exports = router;