const express = require('express');
const router = express.Router();
const { authenticateToken, authorize } = require('../middlewares/authMiddleware');
const turmaController = require('../controllers/turmaController');

// Todas as rotas de alunos exigem autenticação
router.use(authenticateToken);

// Método GET
router.get('/', turmaController.listaTurmas);

module.exports = router;
