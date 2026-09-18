const express = require('express');
const router = express.Router();
const { getCounters, createCounter, updateCounter } = require('../controllers/counterController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', getCounters);
router.post('/', protect, adminOnly, createCounter);
router.patch('/:id', protect, adminOnly, updateCounter);

module.exports = router;
