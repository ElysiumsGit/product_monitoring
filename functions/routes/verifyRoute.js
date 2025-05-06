const express = require("express")
const { verifyUser  } = require("../controllers/verifyController");

// const storage = multer.memoryStorage();
// const upload = multer({ storage: storage });
const router = express.Router();

router.get("/", verifyUser);

module.exports = router;