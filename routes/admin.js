const express = require('express');
const router = express.Router();
const Registration = require('../models/Registration');
const Workshop = require('../models/Workshop');
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
      
      // Explicitly save the session
      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
          return res.status(500).json({
            success: false,
            message: 'Session error'
          });
        }
        
        res.json({
          success: true,
          message: 'Login successful'
        });
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
  } catch (error) {
    console.error('Login error:', error);
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
    const { search, page = 1, limit = 50, workshopId } = req.query;
    
    let query = {};
    
    // Filter by workshop if specified
    if (workshopId) {
      query.workshopId = workshopId;
    }
    
    if (search) {
      const searchConditions = [
        { fullName: { $regex: search, $options: 'i' } },
        { mncUID: { $regex: search, $options: 'i' } },
        { mncRegistrationNumber: { $regex: search, $options: 'i' } },
        { mobileNumber: { $regex: search, $options: 'i' } },
        { paymentUTR: { $regex: search, $options: 'i' } }
      ];
      
      if (workshopId) {
        query.$and = [
          { workshopId: workshopId },
          { $or: searchConditions }
        ];
      } else {
        query.$or = searchConditions;
      }
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
    const { workshopId } = req.query;
    
    let stats = {};
    
    if (workshopId) {
      // Get stats for specific workshop
      const workshop = await Workshop.findById(workshopId);
      if (!workshop) {
        return res.status(404).json({ success: false, message: 'Workshop not found' });
      }
      
      const total = await Registration.getRegistrationCount(workshopId);
      const maxRegistrations = workshop.maxSeats;
      const remaining = Math.max(0, maxRegistrations - total);
      const percentageFilled = total > 0 ? ((total / maxRegistrations) * 100).toFixed(2) : '0.00';
      
      // Get recent registrations for this workshop
      const recent = await Registration.find({ workshopId })
        .sort({ submittedAt: -1 })
        .limit(10)
        .select('fullName mncUID formNumber submittedAt');
      
      stats = {
        total,
        remaining,
        percentageFilled,
        maxRegistrations,
        workshop: {
          id: workshop._id,
          title: workshop.title,
          date: workshop.date,
          fee: workshop.fee,
          credits: workshop.credits,
          venue: workshop.venue,
          status: workshop.status
        }
      };
      
      res.json({
        success: true,
        stats,
        recentRegistrations: recent
      });
    } else {
      // Get aggregated stats for all workshops
      const total = await Registration.getRegistrationCount();
      const allWorkshops = await Workshop.find();
      const totalMaxSeats = allWorkshops.reduce((sum, w) => sum + w.maxSeats, 0);
      const remaining = Math.max(0, totalMaxSeats - total);
      const percentageFilled = total > 0 && totalMaxSeats > 0 
        ? ((total / totalMaxSeats) * 100).toFixed(2)
        : '0.00';
      
      // Get recent registrations across all workshops
      const recent = await Registration.find()
        .sort({ submittedAt: -1 })
        .limit(10)
        .select('fullName mncUID formNumber submittedAt workshopId')
        .populate('workshopId', 'title');
      
      stats = {
        total,
        remaining,
        maxRegistrations: totalMaxSeats,
        percentageFilled,
        workshopCount: allWorkshops.length
      };
      
      res.json({
        success: true,
        stats,
        recentRegistrations: recent
      });
    }

  } catch (error) {
    console.error('Stats API error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching stats',
      error: error.message
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

    // Store workshopId before deletion
    const workshopId = record.workshopId;

    // Delete associated payment screenshot if exists
    if (record.paymentScreenshot) {
      const filePath = path.join(__dirname, '..', 'uploads', 'payments', record.paymentScreenshot);
      if (fs.existsSync(filePath)) {
        fs.unlink(filePath, () => {});
      }
    }

    await record.deleteOne();

    // Decrement workshop registration count
    if (workshopId) {
      const Workshop = require('../models/Workshop');
      const workshop = await Workshop.findById(workshopId);
      if (workshop && workshop.currentRegistrations > 0) {
        workshop.currentRegistrations -= 1;
        await workshop.save();
        console.log(`Decremented registration count for workshop ${workshopId} to ${workshop.currentRegistrations}`);
      }
    }

    res.json({ success: true, message: 'Registration deleted successfully' });
  } catch (error) {
    console.error('Error deleting registration:', error);
    res.status(500).json({ success: false, message: 'Error deleting registration' });
  }
});

module.exports = router;
