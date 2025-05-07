const express = require("express");
const { addGroup, updateGroup, deleteGroup } = require("../controllers/groupController");

const router = express.Router();

router.post("/addGroup/:currentUserId", addGroup);
router.put("/updateGroup/:groupId/:currentUserId", updateGroup);
router.put("/deleteGroup/:groupId/:currentUserId", deleteGroup);

module.exports = router;