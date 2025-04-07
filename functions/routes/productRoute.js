const express = require("express")
const multer = require("multer");
const { addProduct, updateProduct, deleteProduct } = require("../controllers/productController");

const router = express.Router();
const upload = multer({
    storage: multer.memoryStorage(), // Store files in memory before uploading
    limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size (5MB)
});

router.post("/", upload.single("image"), addProduct);
router.put("/:id", updateProduct);
router.delete("/:id", deleteProduct);

module.exports = router;