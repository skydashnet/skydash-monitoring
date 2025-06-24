const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const pppoeController = require('../controllers/pppoeController');

router.use(protect);

router.get('/summary', pppoeController.getSummary);
router.post('/secrets', pppoeController.addSecret);
router.get('/secrets', pppoeController.getSecrets);
router.get('/secrets/:name/details', pppoeController.getSecretDetails);
router.get('/inactive-secrets', pppoeController.getInactiveSecrets);
router.get('/profiles', pppoeController.getPppProfiles);
router.get('/next-ip', pppoeController.getNextIp);
router.get('/secrets/:name/sla', pppoeController.getSlaDetails);
router.get('/secrets/unassigned', pppoeController.getUnassignedSecrets);
router.post('/odp/:odpId/assign-user', pppoeController.assignUserToOdp); 
router.get('/odp/:id/connected-users', pppoeController.getConnectedUsers);
router.put('/secrets/:id/status', pppoeController.setSecretStatus);
router.post('/active/:id/kick', pppoeController.kickActiveUser);
router.get('/management-data', pppoeController.getManagementPageData);

module.exports = router;