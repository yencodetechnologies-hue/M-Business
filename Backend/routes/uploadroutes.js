

const express = require("express");
const router = express.Router();
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
const Media = require("../models/MediaModel");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB to allow larger docs/zips
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      "image/", "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
      "text/plain", "text/csv", "text/html",
      "application/zip", "application/x-zip-compressed",
      "application/x-rar-compressed", "application/vnd.rar",
      "video/", "audio/",
    ];
    const isAllowed = allowedMimes.some(prefix => file.mimetype.startsWith(prefix));
    if (isAllowed) cb(null, true);
    else cb(new Error(`File type not allowed: ${file.mimetype}`), false);
  },
});

// Serve a raw-uploaded file (e.g. SVG) with the correct Content-Type so
// browsers render it inline instead of showing a blank/broken image.
router.get("/raw/*splat", async (req, res) => {
  try {
    const publicId = Array.isArray(req.params.splat) ? req.params.splat.join("/") : req.params.splat;
    const media = await Media.findOne({ public_id: publicId }) || await Media.findOne({ public_id: publicId.replace(/^\/+|\/+$/g, "") });
    if (!media) return res.status(404).json({ msg: "Not found" });
    const response = await require("axios").get(media.url, { responseType: "arraybuffer" });
    res.set("Content-Type", media.type || "image/svg+xml");
    res.set("Cache-Control", "public, max-age=31536000");
    res.send(response.data);
  } catch (err) {
    console.error("❌ Raw media proxy error:", err);
    res.status(500).json({ msg: "Failed to load file" });
  }
});

// GET all uploaded media
router.get("/", async (req, res) => {
  try {
    const media = await Media.find().sort({ createdAt: -1 });
    res.json(media);
  } catch (err) {
    res.status(500).json({ msg: "Error fetching media", error: err });
  }
});

// POST general upload
router.post("/", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ msg: "No file uploaded" });
  }

  // Cloudinary blocks inline delivery of SVGs uploaded as resource_type "image"
  // for security reasons (they render as a broken image instead of showing).
  // Uploading them as "raw" instead makes the URL load/preview correctly.
  const isSvg = req.file.mimetype === "image/svg+xml" || /\.svg$/i.test(req.file.originalname || "");
  const resourceType = isSvg ? "raw" : "auto";

  const uploadStream = cloudinary.uploader.upload_stream(
    {
      folder: "mbusiness/uploads",
      resource_type: resourceType,
    },
    async (error, result) => {
      if (error) {
        console.error("❌ Cloudinary error:", error);
        return res.status(500).json({ msg: "Cloudinary upload failed", error });
      }

      try {
        const newMedia = new Media({
          url: result.secure_url,
          public_id: result.public_id,
          name: req.file.originalname,
          size: req.file.size,
          type: req.file.mimetype,
        });
        await newMedia.save();
        const responseMedia = newMedia.toObject();
        if (isSvg) {
          responseMedia.url = `${req.protocol}://${req.get("host")}/api/upload/raw/${result.public_id}`;
        }
        res.json(responseMedia);
      } catch (err) {
        res.status(500).json({ msg: "Error saving media to DB", error: err });
      }
    }
  );

  streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
});

// Legacy Logo Upload
router.post("/logo", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ msg: "No file uploaded" });
  }
  const uploadStream = cloudinary.uploader.upload_stream(
    {
      folder: "mbusiness/logos",
      resource_type: "auto",
      format: "png",
    },
    (error, result) => {
      if (error) {
        console.error("❌ Cloudinary error:", error);
        return res.status(500).json({ msg: "Cloudinary upload failed", error });
      }
      return res.json({ logoUrl: result.secure_url });
    }
  );
  streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
});

module.exports = router;

