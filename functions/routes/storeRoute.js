const express = require("express")
const { addStore, updateStore, deleteStore } = require("../controllers/storeControllers");
const authenticateToken = require("../middleware/authenticateToken");

const router = express.Router();
router.post("/addStore/:currentUserId",  addStore);
router.put("/updateStore/:storeId/:currentUserId", updateStore);
router.put("/deleteStore/:storeId/:currentUserId", deleteStore);

module.exports = router;