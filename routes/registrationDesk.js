const express = require('express');
const router = express.Router();
const Workshop = require('../models/Workshop');

// Registration Desk login credentials (can be moved to env)
const DESK_USERNAME = process.env.REGISTRATION_DESK_USERNAME || 'desk';
const DESK_PASSWORD = process.env.REGISTRATION_DESK_PASSWORD || 'desk123';

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (username === DESK_USERNAME && password === DESK_PASSWORD) {
      req.session.deskUser = {
        username,
        role: 'registration-desk',
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
    console.error('Registration desk login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
});

// Check session endpoint
router.get('/check-session', (req, res) => {
  if (req.session && (req.session.deskUser || req.session.attendanceUser || req.session.spotUser || req.session.isAdmin)) {
    res.json({
      success: true,
      user: req.session.deskUser || req.session.attendanceUser || req.session.spotUser || { username: 'admin' }
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

// Middleware to check desk auth
function requireDeskAuth(req, res, next) {
  if (req.session && (req.session.deskUser || req.session.attendanceUser || req.session.spotUser || req.session.isAdmin)) {
    next();
  } else {
    res.status(401).json({
      success: false,
      message: 'Unauthorized. Please login first.'
    });
  }
}

// Get workshops for registration desk (today and upcoming)
router.get('/workshops', requireDeskAuth, async (req, res) => {
  try {
    // Get today's date at midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Show all workshops that are today or in the future
    const workshops = await Workshop.find({ 
      date: { $gte: today },
      status: { $in: ['active', 'upcoming', 'spot', 'full'] }
    }).sort({ date: 1 });
    
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

module.exports = router;
