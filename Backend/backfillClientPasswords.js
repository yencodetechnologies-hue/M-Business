// One-time script: run with `node backfillClientPasswords.js`
require("dotenv").config();

const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Client = require("./models/ClientModel");

async function run() {
    await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 30000,
    });

    console.log("Connected to MongoDB");

    const clients = await Client.find({
        $or: [
            { password: "" },
            { password: { $exists: false } },
            { password: null }
        ]
    });

    console.log(`Found ${clients.length} client(s) with no password set.`);

    const hashed = await bcrypt.hash("123456", 10);

    for (const c of clients) {
        c.password = hashed;
        await c.save();
        console.log(`Updated: ${c.email}`);
    }

    console.log("Done.");
    await mongoose.disconnect();
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});