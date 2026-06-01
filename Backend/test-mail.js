const mongoose = require("mongoose");
const { sendSubscriptionSuccess } = require("./config/email");

async function testMail() {
  console.log("Testing email...");
  try {
    const result = await sendSubscriptionSuccess(
      "felshiyairin@gmail.com", 
      "Test User", 
      "Starter Plan", 
      new Date(), 
      new Date(Date.now() + 30*24*60*60*1000)
    );
    console.log("Result:", result);
  } catch (error) {
    console.error("Failed:", error);
  }
}
testMail();
