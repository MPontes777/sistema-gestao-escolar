const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Rota de login e logout
// Método POST é mais seguro que GET, e-mail e senha não são visíveis na URL e nem ficam no histórico do navegador
router.post('/login', authController.login);
router.post('/logout', authController.logout);

module.exports = router;