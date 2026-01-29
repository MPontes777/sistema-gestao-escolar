const express = require('express');
const router = express.Router();
const { authenticateToken, authorize } = require('../middlewares/authMiddleware');
const alunoController = require('../controllers/alunoController');

// Todas as rotas de alunos exigem autenticação
router.use(authenticateToken);

// Método GET
router.get('/', alunoController.listaAlunos);
router.get('/:id', alunoController.buscaAlunoId);

// Método POST
router.post('/', authorize('admin'), alunoController.criaAluno); // Apenas Admin tem permissão

module.exports = router;