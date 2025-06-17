const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const sessionController = require('../controllers/sessionController');

router.use(protect);

router.get('/', sessionController.getActiveSessions);
router.delete('/:id', sessionController.deleteSession);

module.exports = router;