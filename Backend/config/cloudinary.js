const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function sanitizeFolder(folder) {
  const cleaned = String(folder || "mbusiness/uploads").replace(/[^a-zA-Z0-9/_-]/g, "");
  return cleaned || "mbusiness/uploads";
}

function signUpload({ folder = "mbusiness/uploads" } = {}) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    const err = new Error("Cloudinary is not configured");
    err.status = 500;
    throw err;
  }
  const timestamp = Math.round(Date.now() / 1000);
  const safeFolder = sanitizeFolder(folder);
  const paramsToSign = { folder: safeFolder, timestamp };
  const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);
  return {
    timestamp,
    signature,
    folder: safeFolder,
    apiKey,
    cloudName,
  };
}

module.exports = { cloudinary, signUpload, sanitizeFolder };
