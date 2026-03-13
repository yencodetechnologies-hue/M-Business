const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");

router.post("/logo", upload.single("logo"), (req, res) => {
  try {
    res.json({
      message: "Logo uploaded",
      logoUrl: req.file.path
    });
  } catch (err) {
    res.status(500).json({ msg: "Upload failed" });
  }
});

module.exports = router;