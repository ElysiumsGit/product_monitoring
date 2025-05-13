const express = require("express")
const { addProduct, updateProduct, deleteProduct,  } = require("../controllers/productController");

const router = express.Router();

router.post("/add/:currentUserId", addProduct);
// router.get("/getAllProducts", getAllProducts);
// router.get("/getSingleProduct/:productId", getSingleProduct);
router.put("/update/:productId/:currentUserId", updateProduct);
router.put("/delete/:productId/:currentUserId", deleteProduct);

module.exports = router;