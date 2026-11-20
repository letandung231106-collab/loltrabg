const express = require('express');
const router = express.Router();
const equipmentController = require('../controllers/equipmentController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');

router.get('/', equipmentController.getEquipment);
router.get('/types', equipmentController.getEquipmentTypes);
router.get('/alerts', equipmentController.getMaintenanceAlerts);
router.get('/maintenance-alerts', equipmentController.getMaintenanceAlerts);
router.get('/:id', equipmentController.getEquipmentById);
router.post('/', authenticateToken, authorizeRoles('admin', 'manager'), equipmentController.createEquipment);
router.put('/:id', authenticateToken, authorizeRoles('admin', 'manager', 'technician'), equipmentController.updateEquipment);

module.exports = router;
