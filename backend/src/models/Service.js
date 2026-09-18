const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Service name is required'],
    trim: true
  },
  prefix: {
    type: String,
    required: [true, 'Token prefix is required (e.g. REG, MED, CUST)'],
    uppercase: true,
    trim: true,
    maxlength: 5
  },
  description: {
    type: String,
    default: ''
  },
  estimatedTimePerUser: {
    type: Number,
    default: 5 // minutes per customer
  },
  historicalAvgDuration: {
    type: Number,
    default: 5.0
  },
  currentServiceSpeed: {
    type: Number,
    default: 1.0 // 1.0 normal speed, >1.0 fast, <1.0 slow
  },
  status: {
    type: String,
    enum: ['open', 'closed'],
    default: 'open'
  },
  currentCounter: {
    type: Number,
    default: 100
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Service', serviceSchema);
