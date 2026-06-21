const onLogoChange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // Step 1: Local preview — show immediately without Cloudinary
  const localUrl = URL.createObjectURL(file);
  setLogoUrl(localUrl);

  // Step 2: Cloudinary upload
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "ml_default");

  try {
    setLogoLoading(true);
    const res = await axios.post(
      "https://api.cloudinary.com/v1_1/dvbzhmysy/image/upload",
      formData
    );
    setLogoUrl(res.data.secure_url); // Replace with Cloudinary URL
    console.log("✅ Cloudinary URL:", res.data.secure_url);
  } catch (err) {
    console.error("❌ Cloudinary error:", err.response?.data || err.message);
    // Keep local preview (even if Cloudinary fails)
  } finally {
    setLogoLoading(false);
  }
};