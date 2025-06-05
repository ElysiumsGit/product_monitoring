const express = require("express")
const { addStore, updateStore, updateDisplay } = require("../controllers/storeControllers");
const authenticateToken = require("../middleware/authenticateToken");

const router = express.Router();
router.post("/add/:currentUserId", addStore);
router.put("/update/:currentUserId/:targetId", updateStore);
// router.put("/updateDisplay/:storeId/:currentUserId", updateDisplay);

module.exports = router;