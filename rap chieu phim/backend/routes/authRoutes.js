const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middlewares/authMiddleware');

router.post('/login', authController.login);
router.post('/register', authController.register);
router.post('/switch-role', authController.fastSwitchRole);
router.get('/me', authenticateToken, authController.getMe);

module.exports = router;
