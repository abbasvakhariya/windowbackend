const jwt = require('jsonwebtoken');

// Generate JWT token
exports.generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Verify JWT token
exports.verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

