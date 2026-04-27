const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI).then(async () => {
  const RolePermission = require('./Backend/models/RolePermissionModel');
  const docs = await RolePermission.find();
  console.log('Current role permissions in DB:');
  docs.forEach(d => {
    const onCount = Object.values(d.permissions).filter(v => v).length;
    const totalCount = Object.values(d.permissions).length;
    console.log('  role:', d.role, '=>', onCount + '/' + totalCount, 'permissions ON');
    console.log('  permissions:', JSON.stringify(d.permissions, null, 2));
    console.log('---');
  });
  mongoose.disconnect();
}).catch(e => console.error(e.message));
