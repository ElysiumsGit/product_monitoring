const express = require("express")
const { addProduct, getAllProducts, getSingleProduct, updateProduct, deleteProduct,  } = require("../controllers/productController");

const router = express.Router();

router.post("/addProduct/:currentUserId", addProduct);
router.get("/getAllProducts", getAllProducts);
router.get("/getSingleProduct/:productId", getSingleProduct);
router.put("/updateProduct/:productId/:currentUserId", updateProduct);
router.delete("/deleteProduct/:productId/:currentUserId", deleteProduct);

module.exports = router;