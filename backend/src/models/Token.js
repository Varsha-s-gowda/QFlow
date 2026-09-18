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
  counterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Counter',
    default: null
  },
  counterName: {
    type: String,
    default: ''
  },
  tokenNumber: {
    type: String,
    required: true
  },
  sequenceNumber: {
    type: Number,
    required: true
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
  actualWaitDurationMins: {
    type: Number,
    default: null
  },
  actualServiceDurationMins: {
    type: Number,
    default: null
  },
  predictedWaitTimeMins: {
    type: Number,
    default: null
  },
  predictionConfidence: {
    type: Number,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Token', tokenSchema);
