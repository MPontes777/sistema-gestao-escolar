const { verifyToken } = require('../utils/jwt');

// Verifica se usuário está autenticado
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Deve retornar Bearer
    // const token utiliza uma short-circuit evaluation
    // Valor da esquerda é false, undefined, null, 0, "", NaN --> retorna o valor da esquerda
    // Senão retorna o valor da direita

    // Token não fornecido
    if (!token) {
        return res.status(401).json({
            error: 'Token não fornecido'
        });
    }

    // Token inválido
    const decoded = verifyToken(token);
    if (!decoded) {
        return res.status(403).json({
            error: 'Token inválido ou expirado'
        });
    }

    // Token válido
    req.user = decoded;
    next();
}

// Verificar se o usuário tem o perfil correto (permissão de acesso)
function authorize(...perfisPermitidos) {
    // Usuário não autenticado (segunda verificação)
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Usuário não autenticado'
            });
        }

        // Usuário não posui permissão
        if (!perfisPermitidos.includes(req.user.perfil)) {
            return res.status(403).json({
                error: 'Você não tem permissão para acessar este recurso'
            });
        }

        // Usuário possui permissão
        next();
    };
}

module.exports = {
    authenticateToken,
    authorize
};