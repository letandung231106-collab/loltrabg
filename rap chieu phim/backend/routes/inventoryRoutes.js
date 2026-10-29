const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');

router.get('/ingredients', inventoryController.getIngredients);
router.post('/ingredients', authenticateToken, authorizeRoles('admin', 'manager'), inventoryController.createIngredient);
router.get('/logs', inventoryController.getInventoryLogs);
router.post('/logs', authenticateToken, authorizeRoles('admin', 'manager', 'staff'), inventoryController.createInventoryLog);

module.exports = router;
