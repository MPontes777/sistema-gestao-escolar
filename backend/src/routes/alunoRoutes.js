const express = require('express');
const router = express.Router();
const alunoController = require('../controllers/alunoController');
const { authenticateToken } = require('../middlewares/authMiddleware');

// Todas as rotas de alunos exigem autenticação
router.use(authenticateToken);

// Método GET
router.get('/', alunoController.listaAlunos);
router.get('/:id', alunoController.buscaAlunoId);

module.exports = router;