const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const deviceController = require('../controllers/deviceController');

router.use(protect);

router.route('/')
    .get(deviceController.listDevices)
    .post(deviceController.addDevice);

router.route('/:id')
    .put(deviceController.updateDevice)
    .delete(deviceController.deleteDevice);
    
router.get('/capabilities', deviceController.getDeviceCapabilities);


module.exports = router;