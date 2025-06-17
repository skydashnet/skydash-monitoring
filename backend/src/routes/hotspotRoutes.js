const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const hotspotController = require('../controllers/hotspotController');

router.use(protect);

router.get('/summary', hotspotController.getHotspotSummary);
router.get('/users', hotspotController.getHotspotUsers);
router.get('/profiles', hotspotController.getHotspotProfiles);
router.post('/users', hotspotController.addHotspotUser);

module.exports = router;