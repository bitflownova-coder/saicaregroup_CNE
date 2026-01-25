require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const rateLimit = require('express-rate-limit');

const registrationRoutes = require('./routes/registration');
const adminRoutes = require('./routes/admin');
const workshopRoutes = require('./routes/workshop');
const adminWorkshopRoutes = require('./routes/adminWorkshop');
const attendanceRoutes = require('./routes/attendance');
const spotRegistrationRoutes = require('./routes/spotRegistration');
const registrationDeskRoutes = require('./routes/registrationDesk');

const app = express();
const PORT = process.env.PORT || 3000;

// Rate limiting - Only apply to form submissions, not GET requests
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5000, // Increased limit for high traffic
  message: 'Too many requests from this IP, please try again later.',
  skip: (req) => {
    // Skip rate limiting for all GET requests (read-only operations)
    if (req.method === 'GET') {
      return true;
    }
    // Skip admin routes
    if (req.path.startsWith('/api/admin/')) {
      return true;
    }
    // Only apply rate limiting to POST/PUT/DELETE operations
    return false;
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files BEFORE rate limiting
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));
app.use('/assest', express.static('assest'));

// Apply rate limiting only to API routes
app.use('/api/', limiter);

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'SaiCareGroup_CNE_Secret_Key_2025_Secure',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to false for now to work with both HTTP and HTTPS
    httpOnly: true,
    maxAge: 30 * 60 * 1000, // 30 minutes
    sameSite: 'lax' // Prevent CSRF while allowing normal navigation
  }
}));

// Favicon route using logo file if present (before static files to avoid duplication)
app.get('/favicon.ico', (req, res) => {
  const logoPath = path.join(__dirname, 'assest', 'logo.png');
  if (fs.existsSync(logoPath)) {
    return res.sendFile(logoPath);
  }
  // Fallback to payment QR if logo not provided yet
  const qrPath = path.join(__dirname, 'assest', 'PaymentQR.jpeg');
  if (fs.existsSync(qrPath)) {
    return res.sendFile(qrPath);
  }
  return res.status(204).end();
});

// Serve static files BEFORE rate limiting
app.use(express.static('public'));
app.use('/uploads/payments', express.static('uploads/payments'));
app.use('/uploads/qr-codes', express.static('uploads/qr-codes'));
app.use('/assest', express.static('assest'));

// Apply rate limiting only to API routes
app.use('/api/', limiter);

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/saicare_cne_registration')
.then(() => console.log('✅ Connected to MongoDB'))
.catch((err) => console.error('❌ MongoDB connection error:', err));

// Routes
app.use('/api/registration', registrationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/workshop', workshopRoutes);
app.use('/api/admin/workshops', adminWorkshopRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/spot-registration', spotRegistrationRoutes);
app.use('/api/registration-desk', registrationDeskRoutes);

// Serve HTML pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/view-registration', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'view-registration.html'));
});

app.get('/admin-login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin-login.html'));
});

app.get('/admin-dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin-dashboard.html'));
});

app.get('/admin-workshops', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin-workshops.html'));
});

app.get('/attendance-login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'attendance-login.html'));
});

app.get('/attendance-portal', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'attendance-portal.html'));
});

app.get('/attendance-scan', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'attendance-scan.html'));
});

app.get('/spot-login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'spot-login.html'));
});

app.get('/spot-portal', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'spot-portal.html'));
});

app.get('/spot-register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'spot-register.html'));
});

app.get('/registration-desk', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'registration-desk.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Something went wrong!'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 Registration Form: http://localhost:${PORT}`);
  console.log(`👀 View Registration: http://localhost:${PORT}/view-registration`);
  console.log(`🔐 Admin Panel: http://localhost:${PORT}/admin-login`);
  console.log(`�️ Registration Desk: http://localhost:${PORT}/registration-desk`);
});

module.exports = app;
