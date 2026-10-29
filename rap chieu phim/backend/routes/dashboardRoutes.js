const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');

router.get('/summary', authenticateToken, authorizeRoles('admin', 'manager'), dashboardController.getDashboardSummary);
router.get('/analytics', authenticateToken, authorizeRoles('admin', 'manager'), dashboardController.getRevenueAnalytics);

module.exports = router;
