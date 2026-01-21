const mongoose = require('mongoose');

const workshopSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  date: {
    type: Date,
    required: true
  },
  dayOfWeek: {
    type: String,
    required: true,
    enum: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']
  },
  venue: {
    type: String,
    required: true
  },
  venueLink: {
    type: String,
    default: ''
  },
  fee: {
    type: Number,
    required: true,
    min: 0
  },
  credits: {
    type: Number,
    required: true,
    min: 0
  },
  maxSeats: {
    type: Number,
    required: true,
    default: 500,
    min: 1
  },
  currentRegistrations: {
    type: Number,
    default: 0,
    min: 0
  },
  qrCodeImage: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    required: true,
    enum: ['draft', 'upcoming', 'active', 'full', 'completed', 'cancelled', 'spot'],
    default: 'draft'
  },
  registrationStartDate: {
    type: Date,
    default: null
  },
  registrationEndDate: {
    type: Date,
    default: null
  },
  // Spot Registration fields
  spotRegistrationEnabled: {
    type: Boolean,
    default: false
  },
  spotRegistrationLimit: {
    type: Number,
    default: 0,
    min: 0
  },
  currentSpotRegistrations: {
    type: Number,
    default: 0,
    min: 0
  },
  spotRegistrationQRToken: {
    type: String,
    default: null
  },
  spotRegistrationTokenExpiry: {
    type: Date,
    default: null
  },
  createdBy: {
    type: String,
    default: 'admin'
  }
}, {
  timestamps: true
});

// Indexes for performance
workshopSchema.index({ status: 1, date: -1 });
workshopSchema.index({ date: -1 });

// Static methods
workshopSchema.statics.getActiveWorkshop = async function() {
  return await this.findOne({ status: 'active' }).sort({ date: 1 });
};

workshopSchema.statics.getUpcomingWorkshops = async function() {
  return await this.find({ 
    status: { $in: ['upcoming', 'active'] },
    date: { $gte: new Date() }
  }).sort({ date: 1 });
};

workshopSchema.statics.getLatestWorkshop = async function() {
  // First try to get active workshop
  const active = await this.findOne({ status: 'active' });
  if (active) return active;
  
  // If no active, get the nearest upcoming
  return await this.findOne({ 
    status: 'upcoming',
    date: { $gte: new Date() }
  }).sort({ date: 1 });
};

// Instance methods
workshopSchema.methods.incrementRegistrationCount = async function() {
  this.currentRegistrations += 1;
  
  // Auto-mark as full if max seats reached
  if (this.currentRegistrations >= this.maxSeats) {
    this.status = 'full';
  }
  
  return await this.save();
};

workshopSchema.methods.markAsFull = async function() {
  this.status = 'full';
  return await this.save();
};

workshopSchema.methods.markCompleted = async function() {
  this.status = 'completed';
  return await this.save();
};

workshopSchema.methods.canAcceptRegistrations = function() {
  return this.status === 'active' && this.currentRegistrations < this.maxSeats;
};

// Virtual for seats remaining
workshopSchema.virtual('seatsRemaining').get(function() {
  return this.maxSeats - this.currentRegistrations;
});

// Include virtuals in JSON
workshopSchema.set('toJSON', { virtuals: true });
workshopSchema.set('toObject', { virtuals: true });

const Workshop = mongoose.model('Workshop', workshopSchema);

module.exports = Workshop;
