const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const assetController = require('../controllers/assetController');

router.use(protect);

router.route('/')
    .get(assetController.getAssets)
    .post(assetController.addAsset);
router.route('/:id')
    .put(assetController.updateAsset)
    .delete(assetController.deleteAsset);
router.get('/unassigned', assetController.getUnassignedAssets);
router.post('/:odcId/assign-odp', assetController.assignOdpToOdc);
router.get('/odc/:id/connected-odps', assetController.getConnectedOdps);

module.exports = router;