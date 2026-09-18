const express = require('express');
const router = express.Router();
const { getOrganizations, createOrganization } = require('../controllers/orgController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', getOrganizations);
router.post('/', protect, adminOnly, createOrganization);

module.exports = router;
