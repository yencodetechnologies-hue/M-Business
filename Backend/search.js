const mongoose = require('mongoose');
require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
mongoose.connect(process.env.MONGO_URI).then(async () => {
  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  for (let c of collections) {
    const docs = await db.collection(c.name).find({
      $or: [
        {email: /mail/i},
        {name: /name/i},
        {username: /username/i},
        {clientName: /clientname/i},
        {managerName: /managername/i}
      ]
    }).toArray();
    if(docs.length > 0) {
      console.log('Found in', c.name, docs);
    }
  }
  console.log('Done');
  process.exit();
}).catch(console.error);
