const express = require('express');
const router = express.Router();
const { authenticateToken, authorize } = require('../middlewares/authMiddleware');
const planejamentoController = require('../controllers/planejamentoController');

// Todas as rotas de planejamentos exigem autenticação
router.use(authenticateToken);

// Método GET
router.get('/', planejamentoController.listaPlanejamentos);
router.get('/:id', planejamentoController.buscaPlanejamentoId);

// Método POST
router.post('/', planejamentoController.criaPlanejamento);

// Método PUT
router.put('/:id', planejamentoController.editaPlanejamento);

// Método DELETE
router.delete('/:id', planejamentoController.excluiPlanejamento);

module.exports = router;
