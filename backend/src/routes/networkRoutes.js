const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const networkController = require('../controllers/networkController');

router.use(protect);

router.get('/arp', networkController.getArpTable);

module.exports = router;