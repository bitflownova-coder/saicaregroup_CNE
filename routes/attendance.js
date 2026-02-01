const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Workshop = require('../models/Workshop');
const Registration = require('../models/Registration');
const Attendance = require('../models/Attendance');

// In-memory store for active QR tokens (refreshes every 2 minutes)
const activeQRTokens = new Map();

// Attendance login endpoint
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Simple hardcoded credentials (can be moved to env or database)
    const ATTENDANCE_USERNAME = process.env.ATTENDANCE_USERNAME || 'attendance';
    const ATTENDANCE_PASSWORD = process.env.ATTENDANCE_PASSWORD || 'attend123';
    
    if (username === ATTENDANCE_USERNAME && password === ATTENDANCE_PASSWORD) {
      req.session.attendanceUser = {
        username,
        role: 'attendance',
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
    console.error('Attendance login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
});

// Check session endpoint
router.get('/check-session', (req, res) => {
  if (req.session && req.session.attendanceUser) {
    res.json({
      success: true,
      user: req.session.attendanceUser
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

// Middleware to check attendance auth (also allow desk users and admins)
function requireAttendanceAuth(req, res, next) {
  if (req.session && (req.session.attendanceUser || req.session.deskUser || req.session.spotUser || req.session.isAdmin)) {
    next();
  } else {
    res.status(401).json({
      success: false,
      message: 'Unauthorized. Please login first.'
    });
  }
}

// Get active workshops for attendance
router.get('/workshops', requireAttendanceAuth, async (req, res) => {
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
    console.error('Get workshops error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch workshops'
    });
  }
});

// Generate new QR token for a workshop (refreshes every call)
router.get('/qr-token/:workshopId', requireAttendanceAuth, async (req, res) => {
  try {
    const { workshopId } = req.params;
    
    // Verify workshop exists
    const workshop = await Workshop.findById(workshopId);
    if (!workshop) {
      return res.status(404).json({
        success: false,
        message: 'Workshop not found'
      });
    }
    
    // Generate new token (2-minute validity)
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 120000; // 2 minutes
    
    // Store token with workshop ID
    activeQRTokens.set(token, {
      workshopId,
      expiresAt,
      createdAt: Date.now()
    });
    
    // Clean up expired tokens
    for (const [key, value] of activeQRTokens.entries()) {
      if (value.expiresAt < Date.now()) {
        activeQRTokens.delete(key);
      }
    }
    
    res.json({
      success: true,
      token,
      expiresAt,
      workshopId,
      workshopTitle: workshop.title
    });
    
  } catch (error) {
    console.error('QR token generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate QR token'
    });
  }
});

// Scan QR code and mark attendance
router.post('/scan', async (req, res) => {
  try {
    const { token, mncRegistrationNumber, mncUID, mobileNumber } = req.body;
    
    // Validate required fields with specific error messages
    if (!token) {
      return res.json({
        success: false,
        message: 'QR code not scanned. Please scan the QR code first.'
      });
    }
    
    if (!mncUID && !mncRegistrationNumber) {
      return res.json({
        success: false,
        message: 'MNC UID is required. Please enter your MNC UID.'
      });
    }
    
    if (!mobileNumber && !mncRegistrationNumber) {
      return res.json({
        success: false,
        message: 'Mobile Number is required. Please enter your mobile number.'
      });
    }
    
    // Verify token exists and is not expired
    const tokenData = activeQRTokens.get(token);
    if (!tokenData) {
      return res.json({
        success: false,
        message: 'Invalid or expired QR code. Please scan the latest QR code.'
      });
    }
    
    if (tokenData.expiresAt < Date.now()) {
      activeQRTokens.delete(token);
      return res.json({
        success: false,
        message: 'QR code has expired. Please scan the latest QR code.'
      });
    }
    
    const { workshopId } = tokenData;
    
    // Find registration based on what was provided
    let registration;
    if (mncRegistrationNumber) {
      const searchIdentifier = mncRegistrationNumber.trim().toUpperCase();
      registration = await Registration.findOne({
        workshopId,
        mncRegistrationNumber: searchIdentifier
      });
    } else {
      // Search by mncUID and mobileNumber (case-insensitive for mncUID)
      const searchUID = mncUID.trim();
      const searchMobile = mobileNumber.trim();
      registration = await Registration.findOne({
        workshopId,
        mncUID: { $regex: new RegExp(`^${searchUID}$`, 'i') },
        mobileNumber: searchMobile
      });
      
      // Debug logging
      console.log('Attendance lookup:', {
        workshopId,
        searchUID,
        searchMobile,
        found: !!registration
      });
    }
    
    if (!registration) {
      return res.json({
        success: false,
        message: 'No registration found with the provided details for this workshop. Please check your MNC UID and Mobile Number match your registration.'
      });
    }
    
    // Check if attendance already marked
    const existingAttendance = await Attendance.findOne({
      workshopId,
      mncUID: registration.mncUID
    });
    
    if (existingAttendance) {
      return res.json({
        success: false,
        message: 'Attendance already marked for this student'
      });
    }
    
    // Get device info
    const ipAddress = req.ip || req.connection.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';
    
    // Create attendance record
    const attendance = await Attendance.create({
      workshopId,
      registrationId: registration._id,
      mncUID: registration.mncUID,
      mncRegistrationNumber: registration.mncRegistrationNumber,
      studentName: registration.fullName,
      qrToken: token,
      ipAddress,
      userAgent,
      deviceFingerprint: `${userAgent}_${ipAddress}`
    });
    
    // Update registration status to present
    registration.attendanceStatus = 'present';
    await registration.save();
    
    // Delete used token
    activeQRTokens.delete(token);
    
    // Get workshop details
    const workshop = await Workshop.findById(workshopId);
    
    console.log('Attendance marked:', {
      workshopId,
      mncUID: registration.mncUID,
      studentName: registration.fullName
    });
    
    res.json({
      success: true,
      message: 'Attendance marked successfully',
      workshopTitle: workshop ? workshop.title : '',
      studentName: registration.fullName,
      data: {
        studentName: registration.fullName,
        mncRegistrationNumber: registration.mncRegistrationNumber,
        markedAt: attendance.markedAt
      }
    });
    
  } catch (error) {
    console.error('Scan attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark attendance'
    });
  }
});

// Get attendance stats for a workshop
router.get('/stats/:workshopId', requireAttendanceAuth, async (req, res) => {
  try {
    const { workshopId } = req.params;
    
    const totalRegistrations = await Registration.countDocuments({ workshopId });
    const totalPresent = await Attendance.countDocuments({ workshopId });
    const totalApplied = totalRegistrations - totalPresent;
    
    res.json({
      success: true,
      data: {
        totalRegistrations,
        totalPresent,
        totalApplied,
        attendancePercentage: totalRegistrations > 0 
          ? ((totalPresent / totalRegistrations) * 100).toFixed(2)
          : 0
      }
    });
    
  } catch (error) {
    console.error('Get attendance stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance stats'
    });
  }
});

// Get all attendance records for a workshop
router.get('/workshop/:workshopId', requireAttendanceAuth, async (req, res) => {
  try {
    const { workshopId } = req.params;
    
    const attendances = await Attendance.find({ workshopId })
      .sort({ markedAt: -1 })
      .lean();
    
    res.json({
      success: true,
      data: attendances,
      count: attendances.length
    });
    
  } catch (error) {
    console.error('Get workshop attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance records'
    });
  }
});

// Get attendance status for a specific student
router.get('/student/:workshopId/:mncUID', async (req, res) => {
  try {
    const { workshopId, mncUID } = req.params;
    
    const attendance = await Attendance.findOne({
      workshopId,
      mncUID
    });
    
    res.json({
      success: true,
      data: {
        hasAttendance: !!attendance,
        attendance: attendance || null
      }
    });
    
  } catch (error) {
    console.error('Get student attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance status'
    });
  }
});

// Get recent attendance records for a workshop (for registration desk)
router.get('/recent/:workshopId', requireAttendanceAuth, async (req, res) => {
  try {
    const { workshopId } = req.params;
    
    const attendances = await Attendance.find({ workshopId })
      .sort({ markedAt: -1 })
      .limit(50)
      .lean();
    
    res.json({
      success: true,
      data: attendances,
      count: attendances.length
    });
    
  } catch (error) {
    console.error('Get recent attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent attendance'
    });
  }
});

module.exports = router;
