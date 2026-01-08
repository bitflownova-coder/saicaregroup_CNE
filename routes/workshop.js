const express = require('express');
const router = express.Router();
const Workshop = require('../models/Workshop');

// Get active workshop
router.get('/active', async (req, res) => {
  try {
    const workshop = await Workshop.getActiveWorkshop();
    
    if (!workshop) {
      return res.json({
        success: true,
        data: null,
        message: 'No active workshop available'
      });
    }
    
    res.json({
      success: true,
      data: workshop
    });
    
  } catch (error) {
    console.error('Error fetching active workshop:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching active workshop'
    });
  }
});

// Get upcoming workshops
router.get('/upcoming', async (req, res) => {
  try {
    const workshops = await Workshop.getUpcomingWorkshops();
    
    res.json({
      success: true,
      data: workshops
    });
    
  } catch (error) {
    console.error('Error fetching upcoming workshops:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching upcoming workshops'
    });
  }
});

// Get latest workshop (active or upcoming)
router.get('/latest', async (req, res) => {
  try {
    const workshop = await Workshop.getLatestWorkshop();
    
    if (!workshop) {
      return res.json({
        success: true,
        data: null,
        message: 'No workshops available'
      });
    }
    
    res.json({
      success: true,
      data: workshop
    });
    
  } catch (error) {
    console.error('Error fetching latest workshop:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching latest workshop'
    });
  }
});

// Get specific workshop details (public info only)
router.get('/:id', async (req, res) => {
  try {
    const workshop = await Workshop.findById(req.params.id);
    
    if (!workshop) {
      return res.status(404).json({
        success: false,
        message: 'Workshop not found'
      });
    }
    
    // Return public information only
    const publicWorkshop = {
      _id: workshop._id,
      title: workshop.title,
      description: workshop.description,
      date: workshop.date,
      dayOfWeek: workshop.dayOfWeek,
      venue: workshop.venue,
      venueLink: workshop.venueLink,
      fee: workshop.fee,
      credits: workshop.credits,
      maxSeats: workshop.maxSeats,
      currentRegistrations: workshop.currentRegistrations,
      seatsRemaining: workshop.seatsRemaining,
      qrCodeImage: workshop.qrCodeImage,
      status: workshop.status
    };
    
    res.json({
      success: true,
      data: publicWorkshop
    });
    
  } catch (error) {
    console.error('Error fetching workshop:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching workshop'
    });
  }
});

module.exports = router;
