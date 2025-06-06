const express = require("express")
const { manageInventory, updateInventory, deleteInventory } = require("../controllers/inventoryController")

const router = express.Router();

router.post("/add/:currentUserId/:targetId", manageInventory);
router.put("/update/:currentUserId/:targetId/:inventoryId", updateInventory);
router.put("/delete/:currentUserId/:targetId/:inventoryId", deleteInventory);


module.exports = router;