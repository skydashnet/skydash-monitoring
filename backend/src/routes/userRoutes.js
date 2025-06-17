const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const userController = require('../controllers/userController');

router.put('/details', protect, userController.updateUserDetails);
router.put('/change-password', protect, userController.changePassword);
router.post('/avatar', protect, require('../middleware/upload'), userController.updateAvatar);
router.delete('/me', protect, userController.deleteAccount);
router.post('/request-whatsapp-change', protect, userController.requestWhatsappChange);
router.post('/verify-whatsapp-change', protect, userController.verifyWhatsappChange);

module.exports = router;