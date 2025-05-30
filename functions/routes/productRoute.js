const express = require("express")
const { addProduct, updateProduct, deleteProduct  } = require("../controllers/productController");

const router = express.Router();

router.post("/add/:currentUserId", addProduct);
router.put("/update/:currentUserId/:targetId", updateProduct);
router.put("/delete/:currentUserId/:targetId", deleteProduct);

module.exports = router;