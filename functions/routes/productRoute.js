const express = require("express")
const { addProduct, updateProduct } = require("../controllers/productController");

const router = express.Router();
router.post("/", addProduct);
router.post("/:id", updateProduct);

module.exports = router;