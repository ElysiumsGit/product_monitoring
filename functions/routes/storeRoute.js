const express = require("express")
const { addStore, deleteStore, updateStore, assignStore } = require("../controllers/storeControllers");

const router = express.Router();
router.post("/", addStore);
router.delete("/:id", deleteStore);
router.put("/:id", updateStore);
router.put("/:id", assignStore);

module.exports = router;