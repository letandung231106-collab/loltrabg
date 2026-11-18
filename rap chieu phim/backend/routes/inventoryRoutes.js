const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');

router.get('/ingredients', authenticateToken, authorizeRoles('admin', 'manager', 'staff'), inventoryController.getIngredients);
router.post('/ingredients', authenticateToken, authorizeRoles('admin', 'manager'), inventoryController.createIngredient);
router.get('/logs', authenticateToken, authorizeRoles('admin', 'manager', 'staff'), inventoryController.getInventoryLogs);
router.post('/logs', authenticateToken, authorizeRoles('admin', 'manager', 'staff'), inventoryController.createInventoryLog);

module.exports = router;
