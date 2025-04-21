const express = require("express");
const { addGroup, deleteGroup, updateGroup } = require("../controllers/groupController");

const router = express.Router();

router.post("/", addGroup);
router.delete("/:id", deleteGroup);
router.put("/:id", updateGroup);

module.exports = router;