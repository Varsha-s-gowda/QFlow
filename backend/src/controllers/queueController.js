const Token = require('../models/Token');
const Service = require('../models/Service');
const Notification = require('../models/Notification');
const { getPredictedWaitTime } = require('../services/aiServiceBridge');
const { notifyQueueUpdate, notifyTokenUpdate } = require('../socket');

// Helper to create & push notification
const sendNotification = async (userId, tokenId, title, message, type) => {
  try {
    const notif = await Notification.create({
      userId,
      tokenId,
      title,
      message,
      type
    });
    notifyTokenUpdate(userId, { action: 'notification_received', notification: notif });
  } catch (err) {
    console.error('Failed to create notification:', err);
  }
};

// @desc    Join queue & auto-generate digital token with AI prediction
// @route   POST /api/queue/join (User)
exports.joinQueue = async (req, res) => {
  try {
    const { serviceId, customerPhone } = req.body;
    const userId = req.user._id;

    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    if (service.status === 'closed') {
      return res.status(400).json({ message: 'Queue for this service is currently closed' });
    }

    const existingActiveToken = await Token.findOne({
      userId,
      serviceId,
      status: { $in: ['waiting', 'called'] }
    });

    if (existingActiveToken) {
      return res.status(400).json({
        message: 'You already have an active token for this service',
        token: existingActiveToken
      });
    }

    const updatedService = await Service.findByIdAndUpdate(
      serviceId,
      { $inc: { currentCounter: 1 } },
      { new: true }
    );

    const sequenceNumber = updatedService.currentCounter;
    const tokenNumber = `${service.prefix}-${sequenceNumber}`;

    const peopleAhead = await Token.countDocuments({
      serviceId,
      status: 'waiting',
      sequenceNumber: { $lt: sequenceNumber }
    });

    const totalQueueLength = await Token.countDocuments({
      serviceId,
      status: { $in: ['waiting', 'called'] }
    });

    const aiPrediction = await getPredictedWaitTime({
      peopleAhead,
      queueLength: totalQueueLength,
      servicePrefix: service.prefix,
      historicalAvgDuration: service.historicalAvgDuration || service.estimatedTimePerUser,
      currentServiceSpeed: service.currentServiceSpeed || 1.0
    });

    const token = await Token.create({
      serviceId,
      userId,
      tokenNumber,
      sequenceNumber,
      customerName: req.user.name,
      customerPhone: customerPhone || req.user.phone || '',
      status: 'waiting',
      predictedWaitTimeMins: aiPrediction.predictedWaitTimeMins,
      predictionConfidence: aiPrediction.confidenceScore
    });

    // Create Notification
    await sendNotification(
      userId,
      token._id,
      'Token Created',
      `Your digital token #${tokenNumber} for ${service.name} is confirmed. Est. wait time: ~${aiPrediction.predictedWaitTimeMins} mins.`,
      'info'
    );

    const payload = {
      token,
      queueStats: {
        peopleAhead,
        predictedWaitTimeMins: aiPrediction.predictedWaitTimeMins,
        confidenceScore: aiPrediction.confidenceScore,
        expectedCompletionTime: aiPrediction.expectedCompletionTime,
        modelType: aiPrediction.modelType,
        isAIPowered: aiPrediction.isAIPowered
      }
    };

    notifyQueueUpdate(serviceId, { action: 'join', token });

    res.status(201).json(payload);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user's current active token with live position & AI prediction
// @route   GET /api/queue/my-token (User)
exports.getMyActiveToken = async (req, res) => {
  try {
    const token = await Token.findOne({
      userId: req.user._id,
      status: { $in: ['waiting', 'called'] }
    })
      .populate({
        path: 'serviceId',
        populate: { path: 'organizationId', select: 'name code' }
      })
      .sort({ createdAt: -1 });

    if (!token) {
      return res.json({ active: false, token: null });
    }

    const service = token.serviceId;

    const peopleAhead = token.status === 'called' ? 0 : await Token.countDocuments({
      serviceId: service._id,
      status: 'waiting',
      sequenceNumber: { $lt: token.sequenceNumber }
    });

    const totalQueueLength = await Token.countDocuments({
      serviceId: service._id,
      status: { $in: ['waiting', 'called'] }
    });

    const currentCalledToken = await Token.findOne({
      serviceId: service._id,
      status: 'called'
    }).sort({ calledAt: -1 });

    const aiPrediction = await getPredictedWaitTime({
      peopleAhead,
      queueLength: totalQueueLength,
      servicePrefix: service.prefix,
      historicalAvgDuration: service.historicalAvgDuration || service.estimatedTimePerUser,
      currentServiceSpeed: service.currentServiceSpeed || 1.0
    });

    res.json({
      active: true,
      token,
      peopleAhead,
      estimatedWaitTimeMins: aiPrediction.predictedWaitTimeMins,
      aiPrediction,
      currentServingToken: currentCalledToken ? currentCalledToken.tokenNumber : 'None'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get complete service queue & metrics
// @route   GET /api/queue/service/:serviceId
exports.getServiceQueue = async (req, res) => {
  try {
    const { serviceId } = req.params;

    const service = await Service.findById(serviceId).populate('organizationId', 'name code');
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    const tokens = await Token.find({ serviceId }).sort({ sequenceNumber: 1 });

    const waitingTokens = tokens.filter(t => t.status === 'waiting');
    const calledToken = tokens.find(t => t.status === 'called');
    const completedTokens = tokens.filter(t => t.status === 'completed');
    const skippedCount = tokens.filter(t => t.status === 'skipped').length;

    res.json({
      service,
      totalWaiting: waitingTokens.length,
      currentServingToken: calledToken ? calledToken.tokenNumber : null,
      currentCalledToken: calledToken || null,
      completedCount: completedTokens.length,
      skippedCount,
      tokens
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Call next token in queue for a service (Admin)
// @route   POST /api/queue/call-next
exports.callNextToken = async (req, res) => {
  try {
    const { serviceId } = req.body;

    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    const nextToken = await Token.findOne({
      serviceId,
      status: 'waiting'
    }).sort({ sequenceNumber: 1 });

    if (!nextToken) {
      return res.status(404).json({ message: 'No waiting tokens in queue' });
    }

    const now = new Date();
    nextToken.status = 'called';
    nextToken.calledAt = now;

    if (nextToken.createdAt) {
      const waitMs = now.getTime() - new Date(nextToken.createdAt).getTime();
      nextToken.actualWaitDurationMins = Math.round((waitMs / 60000) * 10) / 10;
    }

    await nextToken.save();

    // Send Notification to Called User
    await sendNotification(
      nextToken.userId,
      nextToken._id,
      'YOUR TURN HAS BEEN CALLED!',
      `Token #${nextToken.tokenNumber} is now being served. Please proceed to the counter immediately.`,
      'called'
    );

    // Check remaining waiting tokens and notify those with 2 or fewer people ahead
    const remainingWaiting = await Token.find({ serviceId, status: 'waiting' }).sort({ sequenceNumber: 1 });
    for (let index = 0; index < remainingWaiting.length; index++) {
      const t = remainingWaiting[index];
      if (index < 2) {
        await sendNotification(
          t.userId,
          t._id,
          'Get Ready! Almost Your Turn',
          `Token #${t.tokenNumber}: There are only ${index + 1} person(s) ahead of you.`,
          'approaching'
        );
      }
    }

    notifyQueueUpdate(serviceId, { action: 'token_called', token: nextToken });
    notifyTokenUpdate(nextToken.userId, { action: 'called', token: nextToken });

    res.json({ message: 'Token called successfully', token: nextToken });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update token status (completed, skipped, cancelled)
// @route   PATCH /api/queue/token/:tokenId/status
exports.updateTokenStatus = async (req, res) => {
  try {
    const { tokenId } = req.params;
    const { status } = req.body;

    const validStatuses = ['completed', 'skipped', 'cancelled', 'called', 'waiting'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const token = await Token.findById(tokenId);
    if (!token) {
      return res.status(404).json({ message: 'Token not found' });
    }

    if (status === 'cancelled' && req.user.role !== 'admin' && token.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to cancel this token' });
    }

    const now = new Date();
    token.status = status;

    if (status === 'completed') {
      token.completedAt = now;
      if (token.calledAt) {
        const serviceMs = now.getTime() - new Date(token.calledAt).getTime();
        token.actualServiceDurationMins = Math.round((serviceMs / 60000) * 10) / 10;
      }
      await sendNotification(
        token.userId,
        token._id,
        'Token Completed',
        `Your service for Token #${token.tokenNumber} is marked complete. Thank you!`,
        'completed'
      );
    }

    if (status === 'skipped') {
      await sendNotification(
        token.userId,
        token._id,
        'Token Skipped',
        `Token #${token.tokenNumber} was skipped as you were not present at the counter.`,
        'skipped'
      );
    }

    if (status === 'called') {
      token.calledAt = now;
    }

    await token.save();

    notifyQueueUpdate(token.serviceId, { action: 'status_updated', token });
    notifyTokenUpdate(token.userId, { action: 'status_updated', token });

    res.json(token);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
