require("dotenv").config();
const mongoose = require("mongoose");
const Media = require("../models/MediaModel");

const BASE_URL = process.env.SERVER_URL || "http://localhost:5008";

async function run() {
    await mongoose.connect(process.env.MONGO_URI);

    const svgMedia = await Media.find({
        $or: [
            { type: "image/svg+xml" },
            { name: { $regex: /\.svg$/i } },
        ],
    });

    console.log(`Found ${svgMedia.length} SVG record(s).`);

    for (const m of svgMedia) {
        const proxyUrl = `${BASE_URL}/api/upload/raw/${m.public_id}`;
        if (m.url !== proxyUrl) {
            m.url = proxyUrl;
            await m.save();
            console.log(`Updated: ${m.name} -> ${proxyUrl}`);
        }
    }

    console.log("Done.");
    await mongoose.disconnect();
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});