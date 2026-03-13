router.post("/login", async (req, res) => {
  // ... existing code ...
  
  res.json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      logoUrl: user.logoUrl  // ✅ இது இருக்கா? இல்லன்னா add பண்ணுங்க!
    }
  });
});