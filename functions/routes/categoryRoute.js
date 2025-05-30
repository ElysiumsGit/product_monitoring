const express = require("express");
const { addCategory, updateCategory, deleteCategory } = require("../controllers/categoryController");

const router = express.Router();

router.post("/add/:currentUserId", addCategory);
router.put("/update/:currentUserId/:targetId", updateCategory);
router.put("/delete/:currentUserId/:targetId", deleteCategory);

module.exports = router;