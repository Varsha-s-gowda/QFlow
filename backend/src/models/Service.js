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
    default: 5, // minutes per customer
    min: 1
  },
  status: {
    type: String,
    enum: ['open', 'closed'],
    default: 'open'
  },
  currentCounter: {
    type: Number,
    default: 100 // Starting sequence number, e.g., 100 -> token prefix-101
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Service', serviceSchema);
