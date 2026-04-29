const Vendor = require('../models/VendorModel');

exports.createVendor = async (req, res) => {
  try {
    const companyId = req.companyId || req.body?.companyId || "";
    
    const vendor = new Vendor({
      ...req.body,
      companyId: companyId
    });
    await vendor.save();
    res.status(201).json(vendor);
  } catch (error) {
    console.error('Create vendor error:', error);
    res.status(400).json({ message: error.message });
  }
};

exports.getVendors = async (req, res) => {
  try {
    const companyId = req.companyId || req.body?.companyId;
    
    let vendors;
    if (companyId) {
      vendors = await Vendor.find({ companyId }).sort({ createdAt: -1 });
    } else {
      vendors = await Vendor.find({}).sort({ createdAt: -1 });
    }
    
    res.json(vendors);
  } catch (error) {
    console.error('Get vendors error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.updateVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findByIdAndUpdate(
      req.params.id,
      req.body,
      { returnDocument: 'after' }
    );
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    res.json(vendor);
  } catch (error) {
    console.error('Update vendor error:', error);
    res.status(400).json({ message: error.message });
  }
};

exports.deleteVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findByIdAndDelete(req.params.id);
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    res.json({ message: 'Vendor deleted' });
  } catch (error) {
    console.error('Delete vendor error:', error);
    res.status(500).json({ message: error.message });
  }
};
