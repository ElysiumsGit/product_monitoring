const express = require("express");
const { addGroup, updateGroup, deleteGroup } = require("../controllers/groupController");

const router = express.Router();

router.post("/add/:currentUserId", addGroup);
router.put("/update/:groupId/:currentUserId", updateGroup);
router.put("/delete/:groupId/:currentUserId", deleteGroup);

module.exports = router;