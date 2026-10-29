const express = require('express');
const router = express.Router();
const shiftController = require('../controllers/shiftController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');

router.get('/', authenticateToken, shiftController.getShifts);
router.post('/', authenticateToken, authorizeRoles('admin', 'manager'), shiftController.createShift);
router.put('/:id/status', authenticateToken, shiftController.checkInShift);

module.exports = router;
