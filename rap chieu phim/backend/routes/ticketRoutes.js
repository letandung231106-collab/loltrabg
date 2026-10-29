const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');

router.get('/', authenticateToken, authorizeRoles('admin', 'manager', 'staff'), ticketController.getAllTickets);
router.get('/my-tickets', authenticateToken, ticketController.getMyTickets);
router.post('/verify', authenticateToken, authorizeRoles('admin', 'manager', 'staff'), ticketController.verifyTicket);
router.post('/:id/cancel', authenticateToken, ticketController.cancelTicket);

module.exports = router;
