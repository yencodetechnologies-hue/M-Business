router.post("/login", async (req, res) => {

  res.json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      logoUrl: user.logoUrl  
    }
  });
});