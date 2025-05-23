const express = require("express")
const { manageInventory } = require("../controllers/inventoryController")

const router = express.Router();

router.post("/add/:storeId/:currentUserId", manageInventory);
router.put("/addStocl/:storeId/:currentUserId", )
// router.post("/:store_id", inventoryAssign);
// router.put("/:store_id/updateInventory/:inventory_id", updateStock);
// router.put("/:store_id/updateTreshold/:inventory_id", updateTreshold);
// router.delete("/:store_id/deleteInventory/:inventory_id", deleteInventory);

module.exports = router;