const Token = require('../models/Token');
const Service = require('../models/Service');

// @desc    Join queue & auto-generate digital token
// @route   POST /api/queue/join (User)
exports.joinQueue = async (req, res) => {
  try {
    const { serviceId, customerPhone } = req.body;
    const userId = req.user._id;

    // Check if service exists and is open
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    if (service.status === 'closed') {
      return res.status(400).json({ message: 'Queue for this service is currently closed' });
    }

    // Check if user already has an active token for this service
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

    // Increment service counter atomically
    const updatedService = await Service.findByIdAndUpdate(
      serviceId,
      { $inc: { currentCounter: 1 } },
      { new: true }
    );

    const sequenceNumber = updatedService.currentCounter;
    const tokenNumber = `${service.prefix}-${sequenceNumber}`;

    const token = await Token.create({
      serviceId,
      userId,
      tokenNumber,
      sequenceNumber,
      customerName: req.user.name,
      customerPhone: customerPhone || req.user.phone || '',
      status: 'waiting'
    });

    // Calculate queue stats
    const tokensAhead = await Token.countDocuments({
      serviceId,
      status: 'waiting',
      sequenceNumber: { $lt: sequenceNumber }
    });

    res.status(201).json({
      token,
      queueStats: {
        peopleAhead: tokensAhead,
        estimatedWaitTimeMins: tokensAhead * service.estimatedTimePerUser
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user's current active token with live position
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

    // Tokens waiting ahead of this token
    const peopleAhead = await Token.countDocuments({
      serviceId: service._id,
      status: 'waiting',
      sequenceNumber: { $lt: token.sequenceNumber }
    });

    // Token currently called
    const currentCalledToken = await Token.findOne({
      serviceId: service._id,
      status: 'called'
    }).sort({ calledAt: -1 });

    res.json({
      active: true,
      token,
      peopleAhead: token.status === 'called' ? 0 : peopleAhead,
      estimatedWaitTimeMins: token.status === 'called' ? 0 : peopleAhead * (service.estimatedTimePerUser || 5),
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
    const completedCount = tokens.filter(t => t.status === 'completed').length;
    const skippedCount = tokens.filter(t => t.status === 'skipped').length;

    res.json({
      service,
      totalWaiting: waitingTokens.length,
      currentServingToken: calledToken ? calledToken.tokenNumber : null,
      currentCalledToken: calledToken || null,
      completedCount,
      skippedCount,
      tokens
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Call next token in queue for a service
// @route   POST /api/queue/call-next (Admin)
exports.callNextToken = async (req, res) => {
  try {
    const { serviceId } = req.body;

    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    // Find token currently called and mark it as completed or auto-transition if needed, or check next waiting token
    const nextToken = await Token.findOne({
      serviceId,
      status: 'waiting'
    }).sort({ sequenceNumber: 1 });

    if (!nextToken) {
      return res.status(404).json({ message: 'No waiting tokens in queue' });
    }

    nextToken.status = 'called';
    nextToken.calledAt = Date.now();
    await nextToken.save();

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

    // If user cancelling, verify ownership
    if (status === 'cancelled' && req.user.role !== 'admin' && token.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to cancel this token' });
    }

    token.status = status;
    if (status === 'completed') {
      token.completedAt = Date.now();
    }
    if (status === 'called') {
      token.calledAt = Date.now();
    }

    await token.save();
    res.json(token);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
