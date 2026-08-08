const express = require("express");
const router = express.Router();
const { getSignedPdfUrl } = require("../controllers/filesController");

// GET /api/files/pdf-url?url=<encodedCloudinaryUrl>
router.get("/pdf-url", getSignedPdfUrl);

module.exports = router;