const mongoose = require('mongoose');

const AlertSettingsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  maxMonthlyAmount: {
    type: Number,
    default: 80000,
    min: 0
  },
  maxMonthlyUnits: {
    type: Number,
    default: 1500,
    min: 0
  },
  alertEmails: {
    type: [String],
    default: []
  },
  enableEmailAlerts: {
    type: Boolean,
    default: false
  },
  enablePushAlerts: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

AlertSettingsSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('AlertSettings', AlertSettingsSchema);
