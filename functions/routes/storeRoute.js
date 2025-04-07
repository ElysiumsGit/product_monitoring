const express = require("express")
const { addStore } = require("../controllers/storeControllers");

const router = express.Router();
router.post("/", addStore);

module.exports = router;