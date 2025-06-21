const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const deviceController = require('../controllers/deviceController');

router.use(protect);
router.get('/capabilities', deviceController.getDeviceCapabilities);

router.route('/')
    .get(deviceController.listDevices)
    .post(deviceController.addDevice);
router.route('/:id')
    .put(deviceController.updateDevice)
    .delete(deviceController.deleteDevice);

router.get('/:id/interfaces', deviceController.getInterfaces);

router.put('/:id/wan', deviceController.setWanInterface);

module.exports = router;