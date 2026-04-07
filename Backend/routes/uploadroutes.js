

const express = require("express");
const router = express.Router();
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
const Media = require("../models/MediaModel");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();
const upload  = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Increased to 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files allowed"), false);
  },
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

  const uploadStream = cloudinary.uploader.upload_stream(
    {
      folder: "mbusiness/uploads",
      resource_type: "auto",
    },
    async (error, result) => {
      if (error) {
        console.error("❌ Cloudinary error:", error);
        return res.status(500).json({ msg: "Cloudinary upload failed", error });
      }

      try {
        const newMedia = new Media({
          url:       result.secure_url,
          public_id: result.public_id,
          name:      req.file.originalname,
          size:      req.file.size,
          type:      req.file.mimetype,
        });
        await newMedia.save();
        res.json(newMedia);
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

