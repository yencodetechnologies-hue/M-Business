const multer = require("multer");

// ✅ multer-storage-cloudinary தேவையில்ல — memory storage use பண்ணோம்
// Register-ல logo தேவையில்ல, எல்லாருக்கும் company logo fixed ஆ இருக்கும்
const storage = multer.memoryStorage();
const upload = multer({ storage });

module.exports = upload;
