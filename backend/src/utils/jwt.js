const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET //|| 'jwtsecretkey2025'; // Chave secreta
const JWT_EXPIRES_IN = '8h'; // Token expira em 8 horas

// Gera um token JWT para o usuário
function generateToken(user) {
    const payload = {
        id: user.id,
        email: user.email,
        perfil: user.perfil,
        nome: user.nome
    };

    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN
    });
}

// Valida o token JWT
function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
}

module.exports = {
    generateToken,
    verifyToken
};