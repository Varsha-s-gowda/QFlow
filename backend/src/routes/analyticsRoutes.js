const express = require('express');
const router = express.Router();
const { getAnalyticsOverview } = require('../controllers/analyticsController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/overview', protect, adminOnly, getAnalyticsOverview);

module.exports = router;
