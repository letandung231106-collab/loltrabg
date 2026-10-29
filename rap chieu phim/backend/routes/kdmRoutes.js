const express = require('express');
const router = express.Router();
const kdmController = require('../controllers/kdmController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');

router.get('/licenses', kdmController.getKdmLicenses);
router.post('/licenses', authenticateToken, authorizeRoles('admin', 'manager', 'technician'), kdmController.createKdmLicense);
router.delete('/licenses/:id', authenticateToken, authorizeRoles('admin', 'manager'), kdmController.deleteKdmLicense);

router.get('/lamps', kdmController.getProjectorLamps);
router.put('/lamps/:id', authenticateToken, authorizeRoles('admin', 'manager', 'technician'), kdmController.updateProjectorLamp);

module.exports = router;
