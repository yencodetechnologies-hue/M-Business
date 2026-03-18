
const express = require("express");
const router = express.Router();
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log("☁️ Cloudinary:", {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
});

const storage = multer.memoryStorage();
const upload  = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, 
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files allowed"), false);
  },
});


router.post("/logo", upload.single("file"), (req, res) => {
  console.log("FILES:", req.file);
  console.log("BODY:", req.body);
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
    console.log("✅ Cloudinary success:", result.secure_url);
    return res.json({ logoUrl: result.secure_url });
  }
);
  streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
});

module.exports = router;
