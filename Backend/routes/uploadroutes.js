const express = require("express");
const router = express.Router();
const axios = require("axios");
const Media = require("../models/MediaModel");
const { signUpload } = require("../config/cloudinary");

// Signed params so the browser can upload directly to Cloudinary (no multer).
router.get("/sign", (req, res) => {
  try {
    res.json(signUpload({ folder: req.query.folder }));
  } catch (err) {
    res.status(err.status || 500).json({ msg: err.message || "Failed to sign upload" });
  }
});

// Serve a raw-uploaded file (e.g. SVG) with the correct Content-Type so
// browsers render it inline instead of showing a blank/broken image.
router.get("/raw/*splat", async (req, res) => {
  try {
    const publicId = Array.isArray(req.params.splat) ? req.params.splat.join("/") : req.params.splat;
    const media = await Media.findOne({ public_id: publicId }) || await Media.findOne({ public_id: publicId.replace(/^\/+|\/+$/g, "") });
    if (!media) return res.status(404).json({ msg: "Not found" });
    const response = await axios.get(media.url, { responseType: "arraybuffer" });
    res.set("Content-Type", media.type || "image/svg+xml");
    res.set("Cache-Control", "public, max-age=31536000");
    res.send(response.data);
  } catch (err) {
    console.error("❌ Raw media proxy error:", err);
    res.status(500).json({ msg: "Failed to load file" });
  }
});

router.get("/", async (req, res) => {
  try {
    const media = await Media.find().sort({ createdAt: -1 });
    res.json(media);
  } catch (err) {
    res.status(500).json({ msg: "Error fetching media", error: err });
  }
});

// Register a file that was already uploaded to Cloudinary.
router.post("/", async (req, res) => {
  const { url, public_id, name, size, type } = req.body || {};
  if (!url) return res.status(400).json({ msg: "No file uploaded" });

  try {
    const isSvg = type === "image/svg+xml" || /\.svg$/i.test(name || "");
    const newMedia = new Media({
      url,
      public_id: public_id || `upload-${Date.now()}`,
      name: name || "untitled",
      size: Number(size) || 0,
      type: type || "application/octet-stream",
    });
    await newMedia.save();
    const responseMedia = newMedia.toObject();
    if (isSvg && public_id) {
      responseMedia.url = `${req.protocol}://${req.get("host")}/api/upload/raw/${public_id}`;
    }
    res.json(responseMedia);
  } catch (err) {
    res.status(500).json({ msg: "Error saving media to DB", error: err.message || err });
  }
});

router.post("/logo", async (req, res) => {
  const url = req.body?.url || req.body?.logoUrl;
  if (!url) return res.status(400).json({ msg: "No file uploaded" });
  return res.json({ logoUrl: url });
});

router.get("/proxy-pdf", async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).send("No URL provided");
    const response = await axios.get(url, { responseType: "stream" });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline");
    response.data.pipe(res);
  } catch (error) {
    console.error("PDF Proxy Error:", error.response?.status, error.response?.statusText, error.message);
    res.status(error.response?.status || 500).send(
      `Failed to load PDF: ${error.response?.status || ""} ${error.response?.statusText || error.message}`
    );
  }
});

module.exports = router;
