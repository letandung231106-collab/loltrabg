const express = require('express');
const router = express.Router();
const turnaroundController = require('../controllers/turnaroundController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');

router.get('/', turnaroundController.getTurnaroundChecklists);
router.post('/', authenticateToken, authorizeRoles('admin', 'manager', 'staff'), turnaroundController.submitTurnaround);

module.exports = router;
