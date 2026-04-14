const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendorController');

// Debug middleware
router.use((req, res, next) => {
  console.log('Vendor route accessed:', req.method, req.originalUrl);
  next();
});

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'Vendor routes are working!' });
});

router.post('/', vendorController.createVendor);
router.get('/', vendorController.getVendors);
router.put('/:id', vendorController.updateVendor);
router.delete('/:id', vendorController.deleteVendor);

module.exports = router;
