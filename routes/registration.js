const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Registration = require('../models/Registration');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/payments/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'payment-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Accept only images
  const allowedTypes = /jpeg|jpg|png/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, JPG, PNG) are allowed!'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
});

// Get registration count and remaining slots
router.get('/count', async (req, res) => {
  try {
    const count = await Registration.getRegistrationCount();
    const remaining = Math.max(0, 500 - count);
    const isFull = await Registration.isRegistrationFull();
    
    res.json({
      success: true,
      total: count,
      remaining: remaining,
      isFull: isFull,
      maxRegistrations: 500
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching registration count' });
  }
});

// Submit new registration
router.post('/submit', upload.single('paymentScreenshot'), async (req, res) => {
  try {
    // Check if registration is full
    const isFull = await Registration.isRegistrationFull();
    if (isFull) {
      return res.status(400).json({
        success: false,
        message: 'Registration closed. All 500 seats are filled.'
      });
    }

    // Get next form number
    const formNumber = await getNextFormNumber();

    // Validate required fields
    const { fullName, mncUID, mncRegistrationNumber, mobileNumber, paymentUTR } = req.body;

    if (!fullName || !mncUID || !mncRegistrationNumber || !mobileNumber || !paymentUTR) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Payment screenshot is required'
      });
    }

    // Check if MNC UID already exists
    const existingRegistration = await Registration.findOne({ mncUID: mncUID.trim() });
    if (existingRegistration) {
      return res.status(400).json({
        success: false,
        message: 'This MNC UID is already registered'
      });
    }

    // Get IP address for tracking
    const ipAddress = req.ip || req.connection.remoteAddress;

    // Create new registration
    const registration = new Registration({
      formNumber: formNumber,
      fullName: fullName.trim(),
      mncUID: mncUID.trim(),
      mncRegistrationNumber: mncRegistrationNumber.trim(),
      mobileNumber: mobileNumber.trim(),
      paymentUTR: paymentUTR.trim(),
      paymentScreenshot: req.file.filename,
      ipAddress: ipAddress
    });

    await registration.save();

    res.status(201).json({
      success: true,
      message: 'Registration submitted successfully',
      data: {
        formNumber: registration.formNumber,
        mncUID: registration.mncUID,
        fullName: registration.fullName,
        submittedAt: registration.submittedAt
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'This MNC UID is already registered'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error submitting registration: ' + error.message
    });
  }
});

// View registration by MNC UID and Mobile Number
router.post('/view', async (req, res) => {
  try {
    const { mncUID, mobileNumber } = req.body;

    if (!mncUID || !mobileNumber) {
      return res.status(400).json({
        success: false,
        message: 'MNC UID and Mobile Number are required'
      });
    }

    const registration = await Registration.findOne({
      mncUID: mncUID.trim(),
      mobileNumber: mobileNumber.trim()
    });

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'No registration found with these details'
      });
    }

    res.json({
      success: true,
      data: {
        formNumber: registration.formNumber,
        fullName: registration.fullName,
        mncUID: registration.mncUID,
        mncRegistrationNumber: registration.mncRegistrationNumber,
        mobileNumber: registration.mobileNumber,
        paymentUTR: registration.paymentUTR,
        paymentScreenshot: registration.paymentScreenshot,
        submittedAt: registration.submittedAt,
        downloadCount: registration.downloadCount,
        canDownload: registration.downloadCount < 2
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving registration'
    });
  }
});

// Increment download count
router.post('/download', async (req, res) => {
  try {
    const { mncUID, mobileNumber } = req.body;

    if (!mncUID || !mobileNumber) {
      return res.status(400).json({
        success: false,
        message: 'MNC UID and Mobile Number are required'
      });
    }

    const registration = await Registration.findOne({
      mncUID: mncUID.trim(),
      mobileNumber: mobileNumber.trim()
    });

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'No registration found'
      });
    }

    if (registration.downloadCount >= 2) {
      return res.status(400).json({
        success: false,
        message: 'Download limit reached. You have already downloaded 2 times.'
      });
    }

    await registration.incrementDownload();

    res.json({
      success: true,
      message: 'Download count incremented',
      downloadCount: registration.downloadCount
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Helper to determine next form number with cap
async function getNextFormNumber() {
  const next = await Registration.getNextFormNumber();
  if (next > 500) {
    throw new Error('Registration closed. All 500 seats are filled.');
  }
  return next;
}

module.exports = router;
