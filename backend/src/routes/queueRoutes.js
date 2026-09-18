const express = require('express');
const router = express.Router();
const {
  joinQueue,
  getMyActiveToken,
  getServiceQueue,
  callNextToken,
  updateTokenStatus
} = require('../controllers/queueController');
const { protect, adminOnly } = require('../middleware/auth');

router.post('/join', protect, joinQueue);
router.get('/my-token', protect, getMyActiveToken);
router.get('/service/:serviceId', getServiceQueue);
router.post('/call-next', protect, adminOnly, callNextToken);
router.patch('/token/:tokenId/status', protect, updateTokenStatus);

module.exports = router;
