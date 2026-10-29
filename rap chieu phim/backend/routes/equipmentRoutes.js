const express = require('express');
const router = express.Router();
const equipmentController = require('../controllers/equipmentController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');

router.get('/', equipmentController.getEquipment);
router.get('/types', equipmentController.getEquipmentTypes);
router.get('/alerts', authenticateToken, authorizeRoles('admin', 'manager', 'technician'), equipmentController.getMaintenanceAlerts);
router.post('/', authenticateToken, authorizeRoles('admin', 'manager'), equipmentController.createEquipment);
router.put('/:id', authenticateToken, authorizeRoles('admin', 'manager', 'technician'), equipmentController.updateEquipment);

module.exports = router;
