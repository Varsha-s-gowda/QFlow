const Counter = require('../models/Counter');
const Service = require('../models/Service');

// @desc    Get all counters or by organization
// @route   GET /api/counters
exports.getCounters = async (req, res) => {
  try {
    const { orgId } = req.query;
    const filter = orgId ? { organizationId: orgId } : {};

    const counters = await Counter.find(filter)
      .populate('organizationId', 'name code')
      .populate('assignedServices', 'name prefix status')
      .populate('currentServingToken', 'tokenNumber customerName status');

    res.json(counters);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new counter
// @route   POST /api/counters (Admin)
exports.createCounter = async (req, res) => {
  try {
    const { organizationId, counterNumber, name, assignedServices } = req.body;

    const counter = await Counter.create({
      organizationId,
      counterNumber,
      name,
      assignedServices: assignedServices || [],
      status: 'open'
    });

    res.status(201).json(counter);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update counter services assignment or status
// @route   PATCH /api/counters/:id (Admin)
exports.updateCounter = async (req, res) => {
  try {
    const { id } = req.params;
    const { assignedServices, status, name } = req.body;

    const counter = await Counter.findById(id);
    if (!counter) {
      return res.status(404).json({ message: 'Counter not found' });
    }

    if (assignedServices) counter.assignedServices = assignedServices;
    if (status) counter.status = status;
    if (name) counter.name = name;

    await counter.save();
    res.json(counter);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
