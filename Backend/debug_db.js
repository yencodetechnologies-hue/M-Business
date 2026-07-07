const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose');
require('dotenv').config();
const Document = require('./models/DocumentModel');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("Connected to Mongo");
    const docs = await Document.find({});
    console.log("All documents count:", docs.length);
    console.log(JSON.stringify(docs, null, 2));
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
