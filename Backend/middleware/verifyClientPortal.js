const jwt = require("jsonwebtoken");

module.exports = function verifyClientPortal(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : req.query.token;

  if (!token) return res.status(401).json({ msg: "Portal token required" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
    if (decoded.role !== "client") return res.status(403).json({ msg: "Invalid token role" });
    req.portalClient = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ msg: "Invalid or expired portal token" });
  }
};