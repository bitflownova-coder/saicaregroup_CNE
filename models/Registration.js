const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
  workshopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workshop',
    required: true,
    index: true
  },
  formNumber: {
    type: Number,
    required: true,
    unique: true,
    min: 1,
    max: 500
  },
  mncUID: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  mncRegistrationNumber: {
    type: String,
    required: true,
    trim: true
  },
  mobileNumber: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^[0-9]{10}$/.test(v);
      },
      message: props => `${props.value} is not a valid 10-digit mobile number!`
    }
  },
  paymentUTR: {
    type: String,
    required: true,
    trim: true
  },
  paymentScreenshot: {
    type: String,
    required: true
  },
  downloadCount: {
    type: Number,
    default: 0,
    min: 0,
    max: 2
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  ipAddress: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Index for faster lookups
registrationSchema.index({ mncUID: 1, mobileNumber: 1 });
registrationSchema.index({ workshopId: 1, formNumber: 1 });
registrationSchema.index({ workshopId: 1, submittedAt: -1 });

// Virtual for checking download availability
registrationSchema.virtual('canDownload').get(function() {
  return this.downloadCount < 2;
});

// Method to increment download count
registrationSchema.methods.incrementDownload = async function() {
  if (this.downloadCount >= 2) {
    throw new Error('Download limit reached');
  }
  this.downloadCount += 1;
  return await this.save();
};

// Static method to get next form number safely
registrationSchema.statics.getNextFormNumber = async function(workshopId = null) {
  const query = workshopId ? { workshopId } : {};
  const last = await this.findOne(query, { formNumber: 1 }).sort({ formNumber: -1 }).lean();
  return (last?.formNumber || 0) + 1;
};

// Static method to get registration count
registrationSchema.statics.getRegistrationCount = async function(workshopId = null) {
  const query = workshopId ? { workshopId } : {};
  return await this.countDocuments(query);
};

// Static method to check if registration is full
registrationSchema.statics.isRegistrationFull = async function(workshopId = null) {
  if (workshopId) {
    const Workshop = mongoose.model('Workshop');
    const workshop = await Workshop.findById(workshopId);
    if (!workshop) return true;
    const count = await this.countDocuments({ workshopId });
    return count >= workshop.maxSeats;
  }
  const count = await this.countDocuments();
  return count >= 500;
};

module.exports = mongoose.model('Registration', registrationSchema);
