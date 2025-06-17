const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const workspaceController = require('../controllers/workspaceController');

router.use(protect);
router.post('/set-active-device', workspaceController.setActiveDevice);
router.get('/me', workspaceController.getWorkspace);

module.exports = router;