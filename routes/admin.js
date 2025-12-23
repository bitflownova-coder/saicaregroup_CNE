const express = require('express');
const router = express.Router();
const Registration = require('../models/Registration');
const { isAuthenticated, verifyAdminCredentials } = require('../middleware/auth');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Admin login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const isValid = await verifyAdminCredentials(username, password);

    if (isValid) {
      req.session.isAdmin = true;
      req.session.username = username;
      
      res.json({
        success: true,
        message: 'Login successful'
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Login error'
    });
  }
});

// Admin logout
router.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true, message: 'Logged out successfully' });
});

// Check admin session
router.get('/check-session', (req, res) => {
  if (req.session && req.session.isAdmin) {
    res.json({ success: true, isAdmin: true });
  } else {
    res.json({ success: false, isAdmin: false });
  }
});

// Get all registrations (protected)
router.get('/registrations', isAuthenticated, async (req, res) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    
    let query = {};
    
    if (search) {
      query = {
        $or: [
          { fullName: { $regex: search, $options: 'i' } },
          { mncUID: { $regex: search, $options: 'i' } },
          { mncRegistrationNumber: { $regex: search, $options: 'i' } },
          { mobileNumber: { $regex: search, $options: 'i' } },
          { paymentUTR: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const skip = (page - 1) * limit;
    const total = await Registration.countDocuments(query);
    const registrations = await Registration.find(query)
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: registrations,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching registrations'
    });
  }
});

// Get dashboard stats (protected)
router.get('/stats', isAuthenticated, async (req, res) => {
  try {
    const total = await Registration.getRegistrationCount();
    const remaining = Math.max(0, 500 - total);
    
    // Get recent registrations (last 10)
    const recent = await Registration.find()
      .sort({ submittedAt: -1 })
      .limit(10)
      .select('fullName mncUID formNumber submittedAt');

    res.json({
      success: true,
      stats: {
        total,
        remaining,
        maxRegistrations: 500,
        percentageFilled: ((total / 500) * 100).toFixed(2)
      },
      recentRegistrations: recent
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching stats'
    });
  }
});

// Bulk download as Excel (protected)
router.get('/download-excel', isAuthenticated, async (req, res) => {
  try {
    const registrations = await Registration.find().sort({ submittedAt: -1 });

    // Prepare data for Excel
    const excelData = registrations.map((reg, index) => ({
      'S.No': index + 1,
      'Full Name': reg.fullName,
      'Form Number': reg.formNumber,
      'MNC UID': reg.mncUID,
      'MNC Registration Number': reg.mncRegistrationNumber,
      'Mobile Number': reg.mobileNumber,
      'Payment UTR': reg.paymentUTR,
      'Payment Screenshot': reg.paymentScreenshot,
      'Download Count': reg.downloadCount,
      'Submitted At': new Date(reg.submittedAt).toLocaleString('en-IN'),
      'IP Address': reg.ipAddress || 'N/A'
    }));

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    ws['!cols'] = [
      { wch: 6 },  // S.No
      { wch: 12 }, // Form Number
      { wch: 25 }, // Full Name
      { wch: 15 }, // MNC UID
      { wch: 25 }, // MNC Registration Number
      { wch: 15 }, // Mobile Number
      { wch: 20 }, // Payment UTR
      { wch: 30 }, // Payment Screenshot
      { wch: 15 }, // Download Count
      { wch: 20 }, // Submitted At
      { wch: 15 }  // IP Address
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Registrations');

    // Generate buffer
    const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Set headers for download
    res.setHeader('Content-Disposition', `attachment; filename=CNE_Registrations_${Date.now()}.xlsx`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    
    res.send(excelBuffer);

  } catch (error) {
    console.error('Excel download error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating Excel file'
    });
  }
});

// Delete a registration (protected)
router.delete('/registrations/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const record = await Registration.findById(id);

    if (!record) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }

    // Delete associated payment screenshot if exists
    if (record.paymentScreenshot) {
      const filePath = path.join(__dirname, '..', 'uploads', 'payments', record.paymentScreenshot);
      if (fs.existsSync(filePath)) {
        fs.unlink(filePath, () => {});
      }
    }

    await record.deleteOne();

    res.json({ success: true, message: 'Registration deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting registration' });
  }
});

module.exports = router;
