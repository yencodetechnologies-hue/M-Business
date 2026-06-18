const axios = require("axios");

async function run() {
  const url = "http://localhost:5008/api/projects/6a31283257d9d207ad1b12e4";
  const headers = { "x-company-id": "69ef6039d1b766254ec5051b" };
  const payload = {
    name: "test",
    description: "",
    client: "jhb",
    category: "Web Development",
    priority: "medium",
    status: "Active",
    progress: 0,
    start: "2026-06-16",
    end: "2026-06-16",
    deadline: "2026-06-16",
    budget: "100",
    currency: "₹",
    billed: 0,
    received: 0,
    pending: 100,
    spent: 0,
    assignedTo: ["Test Employee"],
    milestones: [{ name: "Development Complete", date: "" }],
    portalSettings: {
      enablePortal: true,
      showProgress: true,
      showMilestones: true,
      showTeam: false,
      allowMessages: true
    }
  };

  console.log("Sending PUT request to:", url);
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
