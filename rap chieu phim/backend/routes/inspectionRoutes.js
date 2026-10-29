const express = require('express');
const router = express.Router();
const inspectionController = require('../controllers/inspectionController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');

router.get('/', authenticateToken, authorizeRoles('admin', 'manager', 'staff'), inspectionController.getInspections);
router.get('/:id', authenticateToken, authorizeRoles('admin', 'manager', 'staff'), inspectionController.getInspectionById);
router.post('/', authenticateToken, authorizeRoles('admin', 'manager', 'staff'), inspectionController.submitInspection);

module.exports = router;
