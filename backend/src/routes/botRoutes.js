const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const botController = require('../controllers/botController');

router.post('/toggle', protect, botController.toggleBotStatus);
router.post('/test-report', protect, botController.triggerTestReport);

module.exports = router;