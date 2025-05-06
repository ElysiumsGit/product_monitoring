const express = require("express");
const { addCategory, updateCategory, deleteCategory } = require("../controllers/categoryController");

const router = express.Router();

router.post("/addCategory/:currentUserId", addCategory);
router.put("/updateCategory/:categoryId/:currentUserId", updateCategory);
router.put("/deleteCategory/:categoryId/:currentUserId", deleteCategory);

module.exports = router;