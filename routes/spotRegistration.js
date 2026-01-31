const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Workshop = require('../models/Workshop');
const Registration = require('../models/Registration');
const Attendance = require('../models/Attendance');

// Configure multer for payment screenshots
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'payments');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'spot-payment-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image or PDF files are allowed!'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Spot registration login endpoint
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Simple hardcoded credentials (can be moved to env or database)
    const SPOT_USERNAME = process.env.SPOT_REGISTRATION_USERNAME || 'spot';
    const SPOT_PASSWORD = process.env.SPOT_REGISTRATION_PASSWORD || 'spot123';
    
    if (username === SPOT_USERNAME && password === SPOT_PASSWORD) {
      req.session.spotUser = {
        username,
        role: 'spot',
        loginTime: new Date()
      };
      
      return res.json({
        success: true,
        message: 'Login successful'
      });
    }
    
    res.json({
      success: false,
      message: 'Invalid username or password'
    });
    
  } catch (error) {
    console.error('Spot registration login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
});

// Check session endpoint
router.get('/check-session', (req, res) => {
  if (req.session && req.session.spotUser) {
    res.json({
      success: true,
      user: req.session.spotUser
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Not authenticated'
    });
  }
});

// Logout endpoint
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Session destroy error:', err);
    }
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

// Middleware to check spot registration auth (also allow desk users and admins)
function requireSpotAuth(req, res, next) {
  if (req.session && (req.session.spotUser || req.session.deskUser || req.session.attendanceUser || req.session.isAdmin)) {
    next();
  } else {
    res.status(401).json({
      success: false,
      message: 'Unauthorized. Please login first.'
    });
  }
}

// Get workshops with spot registration enabled
router.get('/workshops', requireSpotAuth, async (req, res) => {
  try {
    // Get today's date at midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Show all workshops that are today or in the future
    const workshops = await Workshop.find({ 
      date: { $gte: today }
    }).sort({ date: -1 });
    
    res.json({
      success: true,
      data: workshops
    });
    
  } catch (error) {
    console.error('Get spot workshops error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch workshops'
    });
  }
});

// Generate/Get QR token for spot registration
router.get('/qr-token/:workshopId', requireSpotAuth, async (req, res) => {
  try {
    const { workshopId } = req.params;
    
    const workshop = await Workshop.findById(workshopId);
    if (!workshop) {
      return res.status(404).json({
        success: false,
        message: 'Workshop not found'
      });
    }
    
    if (!workshop.spotRegistrationEnabled) {
      return res.json({
        success: false,
        message: 'Spot registration is not enabled for this workshop'
      });
    }
    
    // Generate new token if doesn't exist or expired
    const now = new Date();
    if (!workshop.spotRegistrationQRToken || !workshop.spotRegistrationTokenExpiry || 
        workshop.spotRegistrationTokenExpiry < now) {
      
      // Generate new token (valid for 24 hours or until manually disabled)
      const token = crypto.randomBytes(32).toString('hex');
      const expiry = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
      
      workshop.spotRegistrationQRToken = token;
      workshop.spotRegistrationTokenExpiry = expiry;
      await workshop.save();
    }
    
    // Get actual spot count from database
    const currentSpotCount = await Registration.countDocuments({
      workshopId: workshop._id,
      registrationType: 'spot'
    });
    
    const spotsRemaining = workshop.spotRegistrationLimit - currentSpotCount;
    
    res.json({
      success: true,
      token: workshop.spotRegistrationQRToken,
      expiresAt: workshop.spotRegistrationTokenExpiry,
      workshopId: workshop._id,
      workshopTitle: workshop.title,
      spotRegistrationLimit: workshop.spotRegistrationLimit,
      currentSpotRegistrations: currentSpotCount,
      spotsRemaining,
      spotsFull: spotsRemaining <= 0
    });
    
  } catch (error) {
    console.error('QR token generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate QR token'
    });
  }
});

// Verify spot registration token (public endpoint)
router.post('/verify-token', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.json({
        success: false,
        message: 'Token is required'
      });
    }
    
    const workshop = await Workshop.findOne({
      spotRegistrationQRToken: token,
      spotRegistrationEnabled: true
    });
    
    if (!workshop) {
      return res.json({
        success: false,
        message: 'Invalid or expired registration link'
      });
    }
    
    // Check if token expired
    if (workshop.spotRegistrationTokenExpiry < new Date()) {
      return res.json({
        success: false,
        message: 'Registration link has expired'
      });
    }
    
    // Check if spots available - use actual count from database
    const currentSpotCount = await Registration.countDocuments({
      workshopId: workshop._id,
      registrationType: 'spot'
    });
    
    const spotsRemaining = workshop.spotRegistrationLimit - currentSpotCount;
    if (spotsRemaining <= 0) {
      return res.json({
        success: false,
        message: 'Spot registration is full for this workshop'
      });
    }
    
    res.json({
      success: true,
      workshop: {
        _id: workshop._id,
        title: workshop.title,
        date: workshop.date,
        venue: workshop.venue,
        fee: workshop.fee,
        credits: workshop.credits,
        spotsRemaining
      }
    });
    
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify token'
    });
  }
});

// Submit spot registration (public endpoint with token)
router.post('/submit', upload.single('paymentScreenshot'), async (req, res) => {
  try {
    const { token, fullName, mncUID, mncRegistrationNumber, mobileNumber, paymentUTR } = req.body;
    
    // Validate required fields
    if (!token || !fullName || !mncUID || !mncRegistrationNumber || !mobileNumber || !paymentUTR) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.json({
        success: false,
        message: 'All fields are required'
      });
    }
    
    if (!req.file) {
      return res.json({
        success: false,
        message: 'Payment screenshot is required'
      });
    }
    
    // Verify token and get workshop
    const workshop = await Workshop.findOne({
      spotRegistrationQRToken: token,
      spotRegistrationEnabled: true
    });
    
    if (!workshop) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.json({
        success: false,
        message: 'Invalid or expired registration link'
      });
    }
    
    // Check if token expired
    if (workshop.spotRegistrationTokenExpiry < new Date()) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.json({
        success: false,
        message: 'Registration link has expired'
      });
    }
    
    // Check spots available - use actual count from database
    const currentSpotCount = await Registration.countDocuments({
      workshopId: workshop._id,
      registrationType: 'spot'
    });
    
    if (currentSpotCount >= workshop.spotRegistrationLimit) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.json({
        success: false,
        message: 'Spot registration is full'
      });
    }
    
    // Validate mobile number
    if (!/^[0-9]{10}$/.test(mobileNumber)) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.json({
        success: false,
        message: 'Invalid mobile number. Must be 10 digits.'
      });
    }
    
    // Check for duplicate MNC UID registration
    const existingReg = await Registration.findOne({
      workshopId: workshop._id,
      mncUID: mncUID.trim().toUpperCase()
    });
    
    if (existingReg) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.json({
        success: false,
        message: 'This MNC UID is already registered for this workshop'
      });
    }
    
    // Get next form number
    const formNumber = await Registration.getNextFormNumber(workshop._id);
    
    // Get IP address
    const ipAddress = req.ip || req.connection.remoteAddress;
    
    // Create registration - Auto-mark as PRESENT since they are registering in front of staff
    const registration = await Registration.create({
      workshopId: workshop._id,
      formNumber,
      mncUID: mncUID.trim().toUpperCase(),
      fullName: fullName.trim(),
      mncRegistrationNumber: mncRegistrationNumber.toUpperCase().trim(),
      mobileNumber: mobileNumber.trim(),
      paymentUTR: paymentUTR.trim(),
      paymentScreenshot: req.file.filename,
      registrationType: 'spot',
      attendanceStatus: 'present',  // Auto-mark as present for spot registrations
      ipAddress,
      submittedAt: new Date()
    });
    
    // Create attendance record automatically for spot registrations
    try {
      await Attendance.create({
        workshopId: workshop._id,
        registrationId: registration._id,
        mncUID: registration.mncUID,
        mncRegistrationNumber: registration.mncRegistrationNumber,
        studentName: registration.fullName,
        qrToken: 'SPOT_REGISTRATION_AUTO',
        markedAt: new Date(),
        ipAddress,
        userAgent: req.headers['user-agent'] || 'Spot Registration'
      });
      console.log('Auto-attendance created for spot registration:', registration.mncUID);
    } catch (attError) {
      // If attendance record already exists, that's fine
      if (attError.code !== 11000) {
        console.error('Error creating attendance record:', attError);
      }
    }
    
    // Increment spot registration count
    workshop.currentSpotRegistrations += 1;
    // Also increment total registrations
    workshop.currentRegistrations += 1;
    
    // Check if workshop should be marked as full
    if (workshop.currentRegistrations >= workshop.maxSeats) {
      workshop.status = 'full';
    }
    
    await workshop.save();
    
    console.log('Spot registration created:', {
      workshopId: workshop._id,
      formNumber,
      mncUID,
      fullName,
      attendanceAutoMarked: true
    });
    
    res.json({
      success: true,
      message: 'Spot registration successful! Attendance auto-marked as present.',
      data: {
        formNumber,
        mncUID,
        workshopTitle: workshop.title,
        registrationType: 'spot'
      }
    });
    
  } catch (error) {
    console.error('Spot registration submission error:', error);
    if (req.file) fs.unlinkSync(req.file.path);
    
    if (error.code === 11000) {
      return res.json({
        success: false,
        message: 'Duplicate registration detected'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Registration failed: ' + error.message
    });
  }
});

// Get spot registration stats for a workshop
router.get('/stats/:workshopId', requireSpotAuth, async (req, res) => {
  try {
    const { workshopId } = req.params;
    
    const workshop = await Workshop.findById(workshopId);
    if (!workshop) {
      return res.status(404).json({
        success: false,
        message: 'Workshop not found'
      });
    }
    
    // Count actual spot registrations from database (more reliable)
    const spotRegistrations = await Registration.countDocuments({
      workshopId,
      registrationType: 'spot'
    });
    
    res.json({
      success: true,
      data: {
        spotRegistrationLimit: workshop.spotRegistrationLimit,
        currentSpotRegistrations: spotRegistrations, // Use actual count from database
        spotsRemaining: workshop.spotRegistrationLimit - spotRegistrations,
        spotRegistrationEnabled: workshop.spotRegistrationEnabled,
        actualSpotCount: spotRegistrations
      }
    });
    
  } catch (error) {
    console.error('Get spot stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch spot registration stats'
    });
  }
});

// Get recent spot registrations for a workshop
router.get('/recent/:workshopId', requireSpotAuth, async (req, res) => {
  try {
    const { workshopId } = req.params;
    
    const registrations = await Registration.find({
      workshopId,
      registrationType: 'spot'
    })
      .sort({ submittedAt: -1 })
      .limit(50)
      .select('fullName mncUID formNumber submittedAt')
      .lean();
    
    res.json({
      success: true,
      data: registrations,
      count: registrations.length
    });
    
  } catch (error) {
    console.error('Get recent spot registrations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent spot registrations'
    });
  }
});

module.exports = router;
