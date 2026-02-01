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

// Método PUT
router.put('/:id', authorize('admin'), alunoController.editaAluno); // Apenas Admin tem permissão
router.put('/:id/inativar', authorize('admin'), alunoController.inativaAluno); // Apenas Admin tem permissão
router.put('/:id/reativar', authorize('admin'), alunoController.reativaAluno); // Apenas Admin tem permissão

// Método DELETE
router.delete('/:id', authorize('admin'), alunoController.excluiAluno); // Apenas Admin tem permissão

module.exports = router;