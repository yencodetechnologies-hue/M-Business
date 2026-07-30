require("dotenv").config();
const mongoose = require("mongoose");
const Media = require("../models/MediaModel");
const Approval = require("../models/ApprovalModel");
const Project = require("../models/ProjectModel");

const BROKEN = "fl_attachment:false/";

function cleanUrl(url) {
    return typeof url === "string" ? url.replace(BROKEN, "") : url;
}

async function run() {
    await mongoose.connect(process.env.MONGO_URI);

    // 1. Media collection
    const media = await Media.find({ url: new RegExp(BROKEN.replace(":", "\\:")) });
    console.log(`Media: found ${media.length} broken URLs`);
    for (const doc of media) {
        doc.url = cleanUrl(doc.url);
        await doc.save();
    }

    // 2. Approval collection (fileUrl + attachments[].url)
    const approvals = await Approval.find({
        $or: [
            { fileUrl: new RegExp(BROKEN.replace(":", "\\:")) },
            { "attachments.url": new RegExp(BROKEN.replace(":", "\\:")) },
        ],
    });
    console.log(`Approvals: found ${approvals.length} broken records`);
    for (const doc of approvals) {
        doc.fileUrl = cleanUrl(doc.fileUrl);
        doc.attachments = (doc.attachments || []).map(a => ({ ...a.toObject?.() ?? a, url: cleanUrl(a.url) }));
        await doc.save();
    }

    // 3. Project.updates[].fileUrl / attachments[].url
    const projects = await Project.find({
        $or: [
            { "updates.fileUrl": new RegExp(BROKEN.replace(":", "\\:")) },
            { "updates.attachments.url": new RegExp(BROKEN.replace(":", "\\:")) },
        ],
    });
    console.log(`Projects: found ${projects.length} with broken update URLs`);
    for (const doc of projects) {
        doc.updates = (doc.updates || []).map(u => ({
            ...(u.toObject?.() ?? u),
            fileUrl: cleanUrl(u.fileUrl),
            attachments: (u.attachments || []).map(a => ({ ...(a.toObject?.() ?? a), url: cleanUrl(a.url) })),
        }));
        doc.markModified("updates");
        await doc.save();
    }

    console.log("Done.");
    process.exit(0);
}

run();