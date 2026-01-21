const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  workshopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workshop',
    required: true,
    index: true
  },
  registrationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Registration',
    required: true
  },
  mncUID: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  mncRegistrationNumber: {
    type: String,
    required: true,
    trim: true
  },
  studentName: {
    type: String,
    required: true,
    trim: true
  },
  qrToken: {
    type: String,
    required: true,
    trim: true
  },
  markedAt: {
    type: Date,
    default: Date.now
  },
  ipAddress: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: null
  },
  deviceFingerprint: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Composite unique index - one attendance per student per workshop
attendanceSchema.index({ workshopId: 1, mncUID: 1 }, { unique: true });
attendanceSchema.index({ workshopId: 1, markedAt: -1 });
attendanceSchema.index({ qrToken: 1 });

// Static method to check if attendance already marked
attendanceSchema.statics.isAttendanceMarked = async function(workshopId, mncUID) {
  const count = await this.countDocuments({ workshopId, mncUID });
  return count > 0;
};

// Static method to get attendance count for workshop
attendanceSchema.statics.getWorkshopAttendanceCount = async function(workshopId) {
  return await this.countDocuments({ workshopId });
};

// Static method to get attendance for a workshop
attendanceSchema.statics.getWorkshopAttendance = async function(workshopId) {
  return await this.find({ workshopId }).sort({ markedAt: -1 });
};

module.exports = mongoose.model('Attendance', attendanceSchema);
