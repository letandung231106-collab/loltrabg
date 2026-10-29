const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');

router.get('/', roomController.getRooms);
router.get('/:id', roomController.getRoomById);
router.put('/:id/status', authenticateToken, authorizeRoles('admin', 'manager', 'staff'), roomController.updateRoomStatus);
router.post('/', authenticateToken, authorizeRoles('admin', 'manager'), roomController.createRoom);

module.exports = router;
