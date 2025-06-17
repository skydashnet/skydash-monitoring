const express = require('express');
const router = express.Router();
const mikrotikController = require('./controllers/mikrotikController');
const { protect } = require('./middleware/authMiddleware');

router.get('/resource', protect, mikrotikController.getSystemResource);

module.exports = router;