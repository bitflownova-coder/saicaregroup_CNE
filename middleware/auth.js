const bcrypt = require('bcrypt');

// Middleware to check if user is authenticated as admin
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.isAdmin) {
    return next();
  }
  return res.status(401).json({ success: false, message: 'Unauthorized access' });
};

// Verify admin credentials
const verifyAdminCredentials = async (username, password) => {
  const adminUsername = process.env.ADMIN_USERNAME || 'saicaregroupofinstitues';
  const adminPassword = process.env.ADMIN_PASSWORD || 'bHAGIRATH@2025?.';
  
  // Simple comparison for username
  if (username !== adminUsername) {
    return false;
  }
  
  // Direct password comparison (in production, you'd store hashed password)
  return password === adminPassword;
};

module.exports = {
  isAuthenticated,
  verifyAdminCredentials
};
