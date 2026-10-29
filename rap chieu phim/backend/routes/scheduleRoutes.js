const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');

router.get('/', scheduleController.getSchedules);
router.get('/:id/seats', scheduleController.getScheduleSeatMap);
router.post('/', authenticateToken, authorizeRoles('admin', 'manager'), scheduleController.createSchedule);
router.delete('/:id', authenticateToken, authorizeRoles('admin', 'manager'), scheduleController.cancelSchedule);

module.exports = router;
