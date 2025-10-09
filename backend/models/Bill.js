const mongoose = require('mongoose');

const BillSchema = new mongoose.Schema({
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: [true, 'Branch is required']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['Electricity', 'Water'],
    required: [true, 'Utility type is required']
  },
  units: {
    type: Number,
    required: [true, 'Units are required'],
    min: [0, 'Units cannot be negative']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
  },
  status: {
    type: String,
    enum: ['Pending', 'Paid', 'Overdue'],
    default: 'Pending'
  },
  periodStart: {
    type: Date,
    required: true,
    default: Date.now
  },
  periodEnd: {
    type: Date
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

// Indexes for faster queries
BillSchema.index({ userId: 1, createdAt: -1 });
BillSchema.index({ branchId: 1, createdAt: -1 });
BillSchema.index({ status: 1 });

// Update timestamp on save
BillSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Bill', BillSchema);
