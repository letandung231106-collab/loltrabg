const express = require('express');
const router = express.Router();
const cashHandoverController = require('../controllers/cashHandoverController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');

router.get('/', cashHandoverController.getHandovers);
router.post('/', authenticateToken, authorizeRoles('admin', 'manager', 'staff'), cashHandoverController.createHandover);
router.put('/:id/approve', authenticateToken, authorizeRoles('admin', 'manager'), cashHandoverController.approveHandover);

module.exports = router;
