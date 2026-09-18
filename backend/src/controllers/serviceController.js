const Service = require('../models/Service');
const Token = require('../models/Token');

// @desc    Get all services or services by organization
// @route   GET /api/services
exports.getServices = async (req, res) => {
  try {
    const { orgId } = req.query;
    const filter = orgId ? { organizationId: orgId } : {};
    const services = await Service.find(filter).populate('organizationId', 'name code');
    res.json(services);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a service
// @route   POST /api/services (Admin)
exports.createService = async (req, res) => {
  try {
    const { organizationId, name, prefix, description, estimatedTimePerUser } = req.body;

    const service = await Service.create({
      organizationId,
      name,
      prefix: prefix.toUpperCase(),
      description,
      estimatedTimePerUser: estimatedTimePerUser || 5,
      status: 'open',
      currentCounter: 100
    });

    res.status(201).json(service);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle service queue status (open / closed)
// @route   PATCH /api/services/:id/status (Admin)
exports.toggleServiceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'open' or 'closed'

    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    if (status && ['open', 'closed'].includes(status)) {
      service.status = status;
    } else {
      service.status = service.status === 'open' ? 'closed' : 'open';
    }

    await service.save();
    res.json(service);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
