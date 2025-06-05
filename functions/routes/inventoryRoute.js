const express = require("express")
const { manageInventory, updateInventory } = require("../controllers/inventoryController")

const router = express.Router();

router.post("/add/:currentUserId/:targetId", manageInventory);
router.put("/update/:currentUserId/:targetId/:inventoryId", updateInventory);


module.exports = router;