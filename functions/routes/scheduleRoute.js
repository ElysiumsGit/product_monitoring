const express = require("express")

const router = express.Router();

router.post("/:id", inventoryAssign);

module.exports = router;