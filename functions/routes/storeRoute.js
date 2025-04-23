const express = require("express")
const { addStore, deleteStore, updateStore, assignStore, deleteAssign, deleteAllAssign } = require("../controllers/storeControllers");
const authenticateToken = require("../middleware/authenticateToken");

const router = express.Router();
router.post("/addStore/:userId",  addStore);
router.delete("/deleteStore/:id", deleteStore);
router.put("/:id", updateStore);
router.post("/:store_id", assignStore);
router.delete("/:store_id/deleteAssign/:assign_id", deleteAssign);
router.delete("/deleteAllAssign/:store_id", deleteAllAssign);

module.exports = router;