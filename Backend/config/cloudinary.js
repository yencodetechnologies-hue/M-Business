const onLogoChange = async (e) => {

  const file = e.target.files[0];

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "ml_default"); 

  try {

    const res = await axios.post(
      "https://api.cloudinary.com/v1_1/dvbzhmysy/image/upload",
      formData
    );

    console.log(res.data.secure_url);

  } catch (err) {
    console.log(err);
  }
};