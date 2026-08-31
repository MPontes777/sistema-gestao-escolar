const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/authMiddleware');
const notaController = require('../controllers/notaController');

// Todas as rotas de notas exigem autenticação
router.use(authenticateToken);

// Método GET
router.get('/', notaController.listaNotas);
router.get('/vinculos', notaController.listaVinculos);
router.get('/resumo-turmas', notaController.listaResumoTurmas);
router.get('/lista-alunos-notas-faltas', notaController.listaAlunosNotasFaltas);

// Método POST
router.post('/', notaController.criaNotas);

// Método PUT
router.put('/:id', notaController.editaMotivoAprovacao);

module.exports = router;
