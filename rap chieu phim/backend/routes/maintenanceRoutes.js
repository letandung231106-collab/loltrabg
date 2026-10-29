const express = require('express');
const router = express.Router();
const maintenanceController = require('../controllers/maintenanceController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');

router.get('/', authenticateToken, authorizeRoles('admin', 'manager', 'technician'), maintenanceController.getMaintenances);
router.post('/', authenticateToken, authorizeRoles('admin', 'manager'), maintenanceController.createMaintenance);
router.put('/:id', authenticateToken, authorizeRoles('admin', 'manager', 'technician'), maintenanceController.updateMaintenance);

module.exports = router;
