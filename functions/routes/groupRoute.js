const express = require("express");
const { addGroup, updateGroup } = require("../controllers/groupController");

const router = express.Router();

router.post("/addGroup/:currentUserId", addGroup);
router.put("/updateGroup/:groupId/:currentUserId", updateGroup);
// router.put("/:id", updateGroup);

module.exports = router;