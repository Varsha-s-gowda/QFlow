const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tokenNumber: {
    type: String,
    required: true // e.g., "REG-101"
  },
  sequenceNumber: {
    type: Number,
    required: true // e.g., 101
  },
  customerName: {
    type: String,
    required: true
  },
  customerPhone: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['waiting', 'called', 'completed', 'skipped', 'cancelled'],
    default: 'waiting'
  },
  calledAt: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Token', tokenSchema);
