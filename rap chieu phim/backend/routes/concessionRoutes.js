const express = require('express');
const router = express.Router();
const concessionController = require('../controllers/concessionController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');

router.get('/', concessionController.getConcessions);
router.post('/', authenticateToken, authorizeRoles('admin', 'manager'), concessionController.createConcession);
router.put('/:id', authenticateToken, authorizeRoles('admin', 'manager'), concessionController.updateConcession);
router.delete('/:id', authenticateToken, authorizeRoles('admin', 'manager'), concessionController.deleteConcession);
router.post('/sell', authenticateToken, concessionController.sellConcessionOrder);

module.exports = router;
