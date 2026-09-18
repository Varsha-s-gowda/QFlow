const express = require('express');
const router = express.Router();
const { getServices, createService, toggleServiceStatus } = require('../controllers/serviceController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', getServices);
router.post('/', protect, adminOnly, createService);
router.patch('/:id/status', protect, adminOnly, toggleServiceStatus);

module.exports = router;
