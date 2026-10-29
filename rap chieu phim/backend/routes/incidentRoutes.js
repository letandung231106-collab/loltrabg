const express = require('express');
const router = express.Router();
const incidentController = require('../controllers/incidentController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');

router.get('/', authenticateToken, authorizeRoles('admin', 'manager', 'staff', 'technician'), incidentController.getIncidents);
router.get('/:id', authenticateToken, authorizeRoles('admin', 'manager', 'staff', 'technician'), incidentController.getIncidentById);
router.post('/', authenticateToken, authorizeRoles('admin', 'manager', 'staff', 'technician'), incidentController.createIncident);
router.post('/:id/assign', authenticateToken, authorizeRoles('admin', 'manager'), incidentController.assignTechnician);
router.post('/:id/resolve', authenticateToken, authorizeRoles('admin', 'manager', 'technician'), incidentController.resolveIncident);
router.post('/:id/close', authenticateToken, authorizeRoles('admin', 'manager'), incidentController.closeIncident);

module.exports = router;
