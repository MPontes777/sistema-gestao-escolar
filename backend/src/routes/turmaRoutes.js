const express = require('express');
const router = express.Router();
const { authenticateToken, authorize } = require('../middlewares/authMiddleware');
const turmaController = require('../controllers/turmaController');

// Todas as rotas de alunos exigem autenticação
router.use(authenticateToken);

// Método GET
router.get('/', turmaController.listaTurmas);
router.get('/ano-serie', turmaController.listaAnoSerie);
router.get('/:id', turmaController.buscaTurmaId);

// Método POST
router.post('/', authorize('admin'), turmaController.criaTurma); // Apenas Admin tem permissão

// Método PUT
router.put('/:id', authorize('admin'), turmaController.editaTurma); // Apenas Admin tem permissão
router.put('/:id/inativar', authorize('admin'), turmaController.inativaTurma); // Apenas Admin tem permissão
router.put('/:id/reativar', authorize('admin'), turmaController.reativaTurma); // Apenas Admin tem permissão

// Método DELETE
router.delete('/:id', authorize('admin'), turmaController.excluiTurma); // Apenas Admin tem permissão

module.exports = router;
