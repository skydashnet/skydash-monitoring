const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/authMiddleware');
const importController = require('../controllers/importController');

const upload = multer({ storage: multer.memoryStorage() });

router.post('/kml', protect, upload.single('kmlFile'), importController.importKml);

module.exports = router;