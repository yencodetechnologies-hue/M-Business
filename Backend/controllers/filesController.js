const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

exports.getSignedPdfUrl = (req, res) => {
  const { url: rawUrl } = req.query;
  if (!rawUrl) return res.status(400).json({ error: "Missing url" });

  try {
    const decoded = decodeURIComponent(rawUrl);
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || "dvbzhmysy";

    if (!decoded.includes(`res.cloudinary.com/${cloudName}/`)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const match = decoded.match(
      new RegExp(`res\\.cloudinary\\.com\\/${cloudName}\\/(\\w+)\\/upload\\/(?:v\\d+\\/)?(.+?)(?:\\?.*)?$`)
    );
    if (!match) return res.status(400).json({ error: "Invalid Cloudinary URL" });

    const resourceType = match[1];
    const publicId = match[2];

    const signedUrl = cloudinary.url(publicId, {
      resource_type: resourceType,
      type: "upload",
      sign_url: true,
      secure: true,
    });

    return res.json({ url: signedUrl });
  } catch (err) {
    console.error("getSignedPdfUrl error:", err.message);
    return res.status(500).json({ error: "Failed to sign URL" });
  }
};