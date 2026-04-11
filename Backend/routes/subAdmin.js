// routes/subAdmin.js
router.get("/my-subscriptions/:subAdminId", async (req, res) => {
  try {
    const subAdmin = await SubAdmin.findById(req.params.subAdminId)
      .select("name mySubscriptions numberOfSubscriptions");

    if (!subAdmin) return res.status(404).json({ message: "SubAdmin not found" });

    res.json({
      mySubscriptions: subAdmin.mySubscriptions,        // true / false
      numberOfSubscriptions: subAdmin.numberOfSubscriptions  // 0 or count
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});