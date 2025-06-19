const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const hotspotController = require('../controllers/hotspotController');

router.use(protect);

router.get('/summary', hotspotController.getHotspotSummary);
router.get('/users', hotspotController.getHotspotUsers);
router.get('/profiles', hotspotController.getHotspotProfiles);
router.post('/users', hotspotController.addHotspotUser);
router.put('/users/:id/status', hotspotController.setHotspotUserStatus);
router.post('/active/:id/kick', hotspotController.kickHotspotUser);
router.post('/vouchers/generate', hotspotController.generateVouchers);

module.exports = router;