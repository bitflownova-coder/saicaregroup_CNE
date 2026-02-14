const express = require('express');
const router = express.Router();
const Workshop = require('../models/Workshop');
const Registration = require('../models/Registration');
const { isAuthenticated } = require('../middleware/auth');
const upload = require('../middleware/upload');
const fs = require('fs');
const path = require('path');

// Admin Routes - All protected by authentication

// Get all workshops (with filters)
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const { status, startDate, endDate, search } = req.query;
    
    let query = {};
    
    // Filter by status
    if (status && status !== 'all') {
      query.status = status;
    }
    
    // Filter by date range
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    // Search by title or description
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const workshops = await Workshop.find(query).sort({ date: -1 });
    
    res.json({
      success: true,
      data: workshops
    });
    
  } catch (error) {
    console.error('Error fetching workshops:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching workshops'
    });
  }
});

// Get specific workshop
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const workshop = await Workshop.findById(req.params.id);
    
    if (!workshop) {
      return res.status(404).json({
        success: false,
        message: 'Workshop not found'
      });
    }
    
    res.json({
      success: true,
      data: workshop
    });
    
  } catch (error) {
    console.error('Error fetching workshop:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching workshop'
    });
  }
});

// Create new workshop
router.post('/', isAuthenticated, upload.single('qrCodeImage'), async (req, res) => {
  try {
    const workshopData = {
      title: req.body.title,
      description: req.body.description || '',
      date: new Date(req.body.date),
      dayOfWeek: req.body.dayOfWeek,
      venue: req.body.venue,
      venueLink: req.body.venueLink || '',
      fee: parseFloat(req.body.fee),
      credits: parseInt(req.body.credits),
      maxSeats: parseInt(req.body.maxSeats) || 500,
      status: req.body.status || 'draft',
      registrationStartDate: req.body.registrationStartDate ? new Date(req.body.registrationStartDate) : null,
      registrationEndDate: req.body.registrationEndDate ? new Date(req.body.registrationEndDate) : null,
      spotRegistrationEnabled: req.body.spotRegistrationEnabled === 'true' || req.body.spotRegistrationEnabled === true || false,
      spotRegistrationLimit: parseInt(req.body.spotRegistrationLimit) || 0,
      createdBy: req.session.username || 'admin'
    };
    
    // Add QR code path if uploaded
    if (req.file) {
      workshopData.qrCodeImage = '/uploads/qr-codes/' + req.file.filename;
    }
    
    const workshop = new Workshop(workshopData);
    await workshop.save();
    
    res.json({
      success: true,
      message: 'Workshop created successfully',
      data: workshop
    });
    
  } catch (error) {
    console.error('Error creating workshop:', error);
    // Delete uploaded file if workshop creation failed
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({
      success: false,
      message: 'Error creating workshop: ' + error.message
    });
  }
});

// Update workshop
router.put('/:id', isAuthenticated, upload.single('qrCodeImage'), async (req, res) => {
  try {
    const workshop = await Workshop.findById(req.params.id);
    
    if (!workshop) {
      return res.status(404).json({
        success: false,
        message: 'Workshop not found'
      });
    }
    
    // Parse and validate maxSeats
    const newMaxSeats = req.body.maxSeats ? parseInt(req.body.maxSeats) : workshop.maxSeats;
    
    // Check if trying to reduce max seats below current registrations
    if (newMaxSeats < workshop.currentRegistrations) {
      return res.status(400).json({
        success: false,
        message: `Cannot reduce max seats below current registrations (${workshop.currentRegistrations})`
      });
    }
    
    // Update fields with proper type conversion
    if (req.body.title !== undefined) workshop.title = req.body.title;
    if (req.body.description !== undefined) workshop.description = req.body.description;
    if (req.body.date !== undefined) workshop.date = new Date(req.body.date);
    if (req.body.dayOfWeek !== undefined) workshop.dayOfWeek = req.body.dayOfWeek;
    if (req.body.venue !== undefined) workshop.venue = req.body.venue;
    if (req.body.venueLink !== undefined) workshop.venueLink = req.body.venueLink;
    if (req.body.fee !== undefined) workshop.fee = parseFloat(req.body.fee);
    if (req.body.credits !== undefined) workshop.credits = parseFloat(req.body.credits);
    if (req.body.maxSeats !== undefined) workshop.maxSeats = parseInt(req.body.maxSeats);
    if (req.body.status !== undefined) workshop.status = req.body.status;
    if (req.body.registrationStartDate !== undefined) {
      workshop.registrationStartDate = req.body.registrationStartDate ? new Date(req.body.registrationStartDate) : null;
    }
    if (req.body.registrationEndDate !== undefined) {
      workshop.registrationEndDate = req.body.registrationEndDate ? new Date(req.body.registrationEndDate) : null;
    }
    if (req.body.spotRegistrationEnabled !== undefined) {
      workshop.spotRegistrationEnabled = req.body.spotRegistrationEnabled === 'true' || req.body.spotRegistrationEnabled === true;
    }
    if (req.body.spotRegistrationLimit !== undefined) {
      const newSpotLimit = parseInt(req.body.spotRegistrationLimit);
      if (newSpotLimit >= workshop.currentSpotRegistrations) {
        workshop.spotRegistrationLimit = newSpotLimit;
      }
    }
    
    // Add QR code if uploaded
    if (req.file) {
      // Delete old QR code if exists
      if (workshop.qrCodeImage) {
        const oldPath = path.join(__dirname, '..', 'uploads', 'qr-codes', path.basename(workshop.qrCodeImage));
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      workshop.qrCodeImage = req.file.filename;
    }
    
    await workshop.save();
    
    res.json({
      success: true,
      message: 'Workshop updated successfully',
      data: workshop
    });
    
  } catch (error) {
    console.error('Error updating workshop:', error);
    // Delete uploaded file if workshop update failed
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({
      success: false,
      message: 'Error updating workshop: ' + error.message
    });
  }
});

// Upload or replace QR code
router.post('/:id/upload-qr', isAuthenticated, upload.single('qrCodeImage'), async (req, res) => {
  try {
    const workshop = await Workshop.findById(req.params.id);
    
    if (!workshop) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'Workshop not found'
      });
    }
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }
    
    // Delete old QR code if exists
    if (workshop.qrCodeImage) {
      const oldPath = path.join(__dirname, '..', 'uploads', 'qr-codes', workshop.qrCodeImage);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }
    
    // Update with new QR code (store just the filename, not the full path)
    workshop.qrCodeImage = req.file.filename;
    await workshop.save();
    
    res.json({
      success: true,
      message: 'QR code uploaded successfully',
      qrCodeImage: workshop.qrCodeImage
    });
    
  } catch (error) {
    console.error('Error uploading QR code:', error);
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({
      success: false,
      message: 'Error uploading QR code'
    });
  }
});

// Change workshop status
router.put('/:id/status', isAuthenticated, async (req, res) => {
  try {
    const { status, spotRegistrationEnabled, spotRegistrationLimit } = req.body;
    const workshop = await Workshop.findById(req.params.id);
    
    if (!workshop) {
      return res.status(404).json({
        success: false,
        message: 'Workshop not found'
      });
    }
    
    workshop.status = status;
    
    // If changing to 'spot' status, update spot settings
    if (status === 'spot' && spotRegistrationEnabled !== undefined) {
      workshop.spotRegistrationEnabled = spotRegistrationEnabled;
      if (spotRegistrationLimit !== undefined) {
        workshop.spotRegistrationLimit = parseInt(spotRegistrationLimit) || 0;
      }
    }
    
    await workshop.save();
    
    res.json({
      success: true,
      message: 'Workshop status updated successfully',
      data: workshop
    });
    
  } catch (error) {
    console.error('Error updating workshop status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating workshop status'
    });
  }
});

// Delete workshop
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const workshop = await Workshop.findById(req.params.id);
    
    if (!workshop) {
      return res.status(404).json({
        success: false,
        message: 'Workshop not found'
      });
    }
    
    // Check actual registration count from database (handle both ObjectId and string formats)
    const registrationCount = await Registration.countDocuments({ 
      $or: [
        { workshopId: workshop._id },
        { workshopId: workshop._id.toString() }
      ]
    });
    
    console.log(`Workshop ${workshop._id} has ${registrationCount} registrations`);
    
    // Update workshop's currentRegistrations to match actual count
    if (workshop.currentRegistrations !== registrationCount) {
      workshop.currentRegistrations = registrationCount;
      await workshop.save();
    }
    
    if (registrationCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete workshop. Found ${registrationCount} registration(s) in database. Please delete all registrations first via the admin panel.`
      });
    }
    
    // Delete QR code file if exists
    if (workshop.qrCodeImage) {
      const qrPath = path.join(__dirname, '..', 'uploads', 'qr-codes', workshop.qrCodeImage);
      if (fs.existsSync(qrPath)) {
        fs.unlinkSync(qrPath);
      }
    }
    
    await Workshop.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Workshop deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting workshop:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting workshop'
    });
  }
});

// Get registrations for a specific workshop
router.get('/:id/registrations', isAuthenticated, async (req, res) => {
  try {
    const { page = 1, limit = 50, search } = req.query;
    
    let query = { workshopId: req.params.id };
    
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { mncUID: { $regex: search, $options: 'i' } },
        { mncRegistrationNumber: { $regex: search, $options: 'i' } },
        { mobileNumber: { $regex: search, $options: 'i' } },
        { paymentUTR: { $regex: search, $options: 'i' } }
      ];
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
    console.error('Error fetching workshop registrations:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching registrations'
    });
  }
});

// Update spot registration settings
router.put('/:id/spot-settings', isAuthenticated, async (req, res) => {
  try {
    const workshop = await Workshop.findById(req.params.id);
    
    if (!workshop) {
      return res.status(404).json({
        success: false,
        message: 'Workshop not found'
      });
    }
    
    const { spotRegistrationEnabled, spotRegistrationLimit } = req.body;
    
    if (spotRegistrationEnabled !== undefined) {
      workshop.spotRegistrationEnabled = spotRegistrationEnabled;
    }
    
    if (spotRegistrationLimit !== undefined) {
      const limit = parseInt(spotRegistrationLimit);
      if (limit < workshop.currentSpotRegistrations) {
        return res.status(400).json({
          success: false,
          message: `Cannot set limit below current spot registrations (${workshop.currentSpotRegistrations})`
        });
      }
      workshop.spotRegistrationLimit = limit;
    }
    
    await workshop.save();
    
    res.json({
      success: true,
      message: 'Spot registration settings updated successfully',
      data: {
        spotRegistrationEnabled: workshop.spotRegistrationEnabled,
        spotRegistrationLimit: workshop.spotRegistrationLimit,
        currentSpotRegistrations: workshop.currentSpotRegistrations
      }
    });
    
  } catch (error) {
    console.error('Error updating spot settings:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating spot registration settings'
    });
  }
});

// Sync workshop registration counts with actual database counts
router.post('/:id/sync-counts', isAuthenticated, async (req, res) => {
  try {
    const workshop = await Workshop.findById(req.params.id);
    
    if (!workshop) {
      return res.status(404).json({
        success: false,
        message: 'Workshop not found'
      });
    }
    
    // Count actual registrations from database
    const totalRegistrations = await Registration.countDocuments({
      workshopId: workshop._id
    });
    
    const spotRegistrations = await Registration.countDocuments({
      workshopId: workshop._id,
      registrationType: 'spot'
    });
    
    const onlineRegistrations = await Registration.countDocuments({
      workshopId: workshop._id,
      registrationType: 'online'
    });
    
    // Update workshop with actual counts
    const oldTotalCount = workshop.currentRegistrations;
    const oldSpotCount = workshop.currentSpotRegistrations;
    
    workshop.currentRegistrations = totalRegistrations;
    workshop.currentSpotRegistrations = spotRegistrations;
    
    await workshop.save();
    
    res.json({
      success: true,
      message: 'Registration counts synchronized successfully',
      data: {
        before: {
          total: oldTotalCount,
          spot: oldSpotCount
        },
        after: {
          total: totalRegistrations,
          spot: spotRegistrations,
          online: onlineRegistrations
        },
        workshop: workshop
      }
    });
    
  } catch (error) {
    console.error('Error syncing counts:', error);
    res.status(500).json({
      success: false,
      message: 'Error synchronizing counts'
    });
  }
});

module.exports = router;
