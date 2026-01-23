const express = require('express');
const router = express.Router();
const { getStats } = require('../controllers/dashboardController');
const { authenticateToken } = require('../middlewares/authMiddleware');

// Método GET
router.get('/stats', authenticateToken, getStats);

module.exports = router;