// Central error handler — add as last middleware in server.js
const errorHandler = (err, req, res, next) => {
  console.error("🔴 Error:", err.stack);

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};

// 404 handler — add before errorHandler
const notFound = (req, res, next) => {
  const err = new Error(`Route not found: ${req.originalUrl}`);
  res.status(404);
  next(err);
};

module.exports = { errorHandler, notFound };
