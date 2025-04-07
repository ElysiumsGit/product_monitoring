const express = require("express")
const { addStore, deleteStore, updateStore } = require("../controllers/storeControllers");

const router = express.Router();
router.post("/", addStore);
router.delete("/:id", deleteStore);
router.put("/:id", updateStore);

module.exports = router;