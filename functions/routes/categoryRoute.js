const express = require("express");
const { addCategory, updateCategory, deleteCategory } = require("../controllers/categoryController");

const router = express.Router();

router.post("/", addCategory);
router.put("/:id", updateCategory);
router.delete("/:id", deleteCategory);

module.exports = router;