const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');

router.get('/', authenticateToken, authorizeRoles('admin', 'manager'), customerController.getCustomers);
router.get('/:id', authenticateToken, authorizeRoles('admin', 'manager'), customerController.getCustomerById);

module.exports = router;
