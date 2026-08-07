const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/authMiddleware');
const disciplinaController = require('../controllers/disciplinaController');

// Todas as rotas de disciplinas exigem autenticação
router.use(authenticateToken);

// Método GET
router.get('/', disciplinaController.listaDisciplinas);

module.exports = router;
