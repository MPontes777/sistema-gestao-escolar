const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const { generateToken } = require('../utils/jwt');

const prisma = new PrismaClient();

// Autentica usuário e retorna token JWT
async function login(req, res) {
    try {
        const { email, senha } = req.body;

        // Validações básicas
        if (!email || !senha) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'E-mail e senha são obrigatórios',
            });
        }

        // Busca usuário no banco
        const usuario = await prisma.usuario.findUnique({
            where: { email },
        });

        // Usuário não existe
        if (!usuario) {
            return res.status(401).json({
                sucesso: false,
                mensagem: 'Credenciais inválidas',
            });
        }

        // Usuário inativo
        if (usuario.inativadoAt) {
            return res.status(401).json({
                sucesso: false,
                mensagem: 'Credenciais inválidas',
            });
        }

        // Valida senha
        const senhaValida = await bcrypt.compare(senha, usuario.senha);
        if (!senhaValida) {
            return res.status(401).json({
                sucesso: false,
                mensagem: 'Credenciais inválidas',
            });
        }

        // Gera token
        const token = generateToken(usuario);
        return res.status(200).json({
            sucesso: true,
            mensagem: 'Login realizado com sucesso',
            dados: {
                token,
                usuario: {
                    id: usuario.id,
                    nome: usuario.nome,
                    email: usuario.email,
                    perfil: usuario.perfil,
                },
            },
        });
    } catch (error) {
        console.error('Erro no login:', error);
        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro interno do servidor',
            erro: error.message,
        });
    }
}

// Invalida o token do usuário
async function logout(req, res) {
    return res.status(200).json({
        sucesso: true,
        mensagem: 'Logout realizado com sucesso',
    });
}

module.exports = {
    login,
    logout,
};
