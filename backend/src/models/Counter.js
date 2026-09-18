const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  counterNumber: {
    type: Number,
    required: true
  },
  name: {
    type: String,
    required: true, // e.g. "Counter 1 - General", "Desk A"
    trim: true
  },
  assignedServices: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service'
  }],
  status: {
    type: String,
    enum: ['open', 'closed', 'busy'],
    default: 'open'
  },
  currentServingToken: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Token',
    default: null
  },
  tokensServedCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Counter', counterSchema);
