const express = require("express")
const { addStore, updateStore, deleteStore } = require("../controllers/storeControllers");
const authenticateToken = require("../middleware/authenticateToken");

const router = express.Router();
router.post("/add/:currentUserId",  addStore);
router.put("/update/:storeId/:currentUserId", updateStore);
router.put("/delete/:storeId/:currentUserId", deleteStore);

module.exports = router;