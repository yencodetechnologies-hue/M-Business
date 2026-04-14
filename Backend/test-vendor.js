const axios = require("axios");
async function test() {
  try {
    const res = await axios.post("http://localhost:5000/api/vendors", {
      vendorName: "Test",
      vendorProduct: "Test Product",
      amountTaxGst: 100,
      paidAmount: 100,
      companyId: "test_company"
    });
    console.log("Success:", res.data);
  } catch (err) {
    console.error("Error:", err.response ? err.response.data : err.message);
  }
}
test();
