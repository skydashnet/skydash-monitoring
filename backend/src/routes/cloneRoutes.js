const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const cloneController = require('../controllers/cloneController');

router.use(protect);

router.post('/generate-code', cloneController.generateCode);
router.post('/use-code', cloneController.useCode);

module.exports = router;