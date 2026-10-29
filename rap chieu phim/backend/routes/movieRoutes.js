const express = require('express');
const router = express.Router();
const movieController = require('../controllers/movieController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');

router.get('/', movieController.getMovies);
router.get('/:id', movieController.getMovieById);
router.post('/', authenticateToken, authorizeRoles('admin', 'manager'), movieController.createMovie);
router.put('/:id', authenticateToken, authorizeRoles('admin', 'manager'), movieController.updateMovie);
router.delete('/:id', authenticateToken, authorizeRoles('admin'), movieController.deleteMovie);

module.exports = router;
