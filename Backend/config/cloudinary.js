const onLogoChange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // Step 1: Local preview — Cloudinary இல்லாம உடனே show ஆகும்
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
    setLogoUrl(res.data.secure_url); // Cloudinary URL replace பண்ணும்
    console.log("✅ Cloudinary URL:", res.data.secure_url);
  } catch (err) {
    console.error("❌ Cloudinary error:", err.response?.data || err.message);
    // Local preview-ஐ வச்சுக்கும் (cloudinary fail ஆனாலும்)
  } finally {
    setLogoLoading(false);
  }
};