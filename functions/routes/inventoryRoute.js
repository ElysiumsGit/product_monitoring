const express = require("express")
const { manageInventory, updateInventory } = require("../controllers/inventoryController")

const router = express.Router();

router.post("/add/:storeId/:currentUserId", manageInventory);
router.put("/update/:storeId/:currentUserId/:inventoryId", updateInventory);


module.exports = router;