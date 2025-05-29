const express = require("express")
const { verifyUser  } = require("../controllers/verifyController");

const router = express.Router();

router.get("/", verifyUser);

module.exports = router;