const express = require('express');
const router = express.Router();
const registrationController = require('../controllers/registrationController');

router.post('/request-otp', registrationController.requestOtp);
router.post('/verify-otp', registrationController.verifyOtpAndRegister);

module.exports = router;