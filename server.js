require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const rateLimit = require('express-rate-limit');
const compression = require('compression');

const registrationRoutes = require('./routes/registration');
const adminRoutes = require('./routes/admin');
const workshopRoutes = require('./routes/workshop');
const adminWorkshopRoutes = require('./routes/adminWorkshop');

const app = express();
const PORT = process.env.PORT || 3000;

// Rate limiting - optimized for high traffic
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5000, // Increased to 5000 requests per 15 min per IP (supports 1000+ concurrent users)
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests from this IP, please try again later.' },
  skip: (req) => {
    // Exclude count endpoint and admin auth endpoints from rate limiting
    return req.path === '/api/registration/count' ||
           req.path === '/api/admin/check-session' ||
           req.path === '/api/admin/login' ||
           req.path === '/api/admin/logout' ||
           req.path.startsWith('/api/admin/');
  }
});

// Middleware
app.use(compression()); // Enable gzip compression
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Trust proxy for rate limiting behind nginx
app.set('trust proxy', 1);

// Serve static files BEFORE rate limiting
app.use(express.static('public', { maxAge: '1d' })); // Cache static files for 1 day
app.use('/uploads', express.static('uploads', { maxAge: '7d' })); // Cache uploads for 7 days
app.use('/assest', express.static('assest', { maxAge: '7d' }));

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

// MongoDB Connection with optimized settings for high load
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/saicare_cne_registration', {
  maxPoolSize: 50, // Increase connection pool for high concurrency
  minPoolSize: 10,
  maxIdleTimeMS: 30000,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch((err) => console.error('❌ MongoDB connection error:', err));

// Routes
app.use('/api/registration', registrationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/workshop', workshopRoutes);
app.use('/api/admin/workshops', adminWorkshopRoutes);

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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Something went wrong!'
  }); with graceful shutdown support
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 Registration Form: http://localhost:${PORT}`);
  console.log(`👀 View Registration: http://localhost:${PORT}/view-registration`);
  console.log(`🔐 Admin Panel: http://localhost:${PORT}/admin-login`);
  
  // Signal PM2 that app is ready
  if (process.send) {
    process.send('ready');
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully...');
  server.close(async () => {
    await mongoose.connection.close();
    process.exit(0);
  }
  console.log(`📝 Registration Form: http://localhost:${PORT}`);
  console.log(`👀 View Registration: http://localhost:${PORT}/view-registration`);
  console.log(`🔐 Admin Panel: http://localhost:${PORT}/admin-login`);
});

module.exports = app;
