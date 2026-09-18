const Organization = require('../models/Organization');
const Service = require('../models/Service');

// @desc    Get all organizations with their services
// @route   GET /api/orgs
exports.getOrganizations = async (req, res) => {
  try {
    const orgs = await Organization.find();
    const services = await Service.find();

    const orgsWithServices = orgs.map(org => {
      const orgServices = services.filter(s => s.organizationId.toString() === org._id.toString());
      return {
        ...org.toObject(),
        services: orgServices
      };
    });

    res.json(orgsWithServices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create an organization
// @route   POST /api/orgs (Admin)
exports.createOrganization = async (req, res) => {
  try {
    const { name, code, description, address } = req.body;

    const existingCode = await Organization.findOne({ code: code.toUpperCase() });
    if (existingCode) {
      return res.status(400).json({ message: 'Organization code already in use' });
    }

    const org = await Organization.create({
      name,
      code: code.toUpperCase(),
      description,
      address
    });

    res.status(201).json(org);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
