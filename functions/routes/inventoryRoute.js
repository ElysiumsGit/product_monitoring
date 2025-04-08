const express = require("express")
const { inventoryAssign, updateInventory } = require("../controllers/inventoryController")

const router = express.Router();

router.post("/", inventoryAssign);
router.put("/:id", updateInventory);

module.exports = router;