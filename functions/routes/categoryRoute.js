const express = require("express");
const { addCategory, updateCategory, deleteCategory } = require("../controllers/categoryController");

const router = express.Router();

router.post("/add/:currentUserId", addCategory);
router.put("/update/:categoryId/:currentUserId", updateCategory);
router.put("/delete/:categoryId/:currentUserId", deleteCategory);

module.exports = router;