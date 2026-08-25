const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/authMiddleware');
const faltaController = require('../controllers/faltaController');

// Todas as rotas de faltas exigem autenticação
router.use(authenticateToken);

// Método GET
router.get('/', faltaController.listaFaltas);
router.get('/vinculos', faltaController.listaVinculos);
router.get('/aproveitamento', faltaController.calculaAproveitamento);

// Método POST
router.post('/', faltaController.criaFaltas);

// Método PUT
router.put('/:id', faltaController.editaFalta);

module.exports = router;
