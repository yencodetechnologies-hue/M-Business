const axios = require("axios");

async function run() {
  const url = "http://localhost:5008/api/projects/undefined";
  const headers = { "x-company-id": "69ef6039d1b766254ec5051b" };
  const payload = {
    name: "test",
    description: "",
    client: "jhb"
  };

  console.log("Sending PUT request to undefined ID...");
  try {
    const res = await axios.put(url, payload, { headers, timeout: 5000 });
    console.log("Response status:", res.status);
    console.log("Response data:", res.data);
  } catch (err) {
    if (err.code === 'ECONNABORTED') {
      console.error("Request timed out!");
    } else {
      console.error("Request failed:", err.message);
      if (err.response) {
        console.error("Response status:", err.response.status);
        console.error("Response data:", err.response.data);
      }
    }
  }
}

run();
