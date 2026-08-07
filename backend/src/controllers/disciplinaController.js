const prisma = require('../utils/prisma');

// Lista disciplinas ativas
const listaDisciplinas = async (req, res) => {
    try {
        const { perfil, id: userId } = req.user;

        const where = { ativo: true };

        // Controle de acesso
        switch (perfil) {
            case 'admin': // Admin vê todas as disciplinas ativas
                break;

            case 'professor': {
                // Professor vê apenas as disciplinas que leciona
                const vinculos = await prisma.professorTurma.findMany({
                    where: { professorId: userId },
                    select: { disciplinaId: true },
                });

                const disciplinaIds = [...new Set(vinculos.map((v) => v.disciplinaId))];

                if (disciplinaIds.length === 0) {
                    return res.status(200).json({
                        sucesso: true,
                        mensagem: 'Nenhuma disciplina encontrada',
                        dados: [],
                    });
                }

                where.id = { in: disciplinaIds };
                break;
            }

            default:
                return res.status(403).json({
                    sucesso: false,
                    mensagem: 'Acesso não autorizado',
                });
        }

        const disciplinas = await prisma.disciplina.findMany({
            where,
            orderBy: { nome: 'asc' },
        });

        return res.status(200).json({
            sucesso: true,
            mensagem: 'Disciplinas listadas',
            dados: disciplinas,
        });
    } catch (error) {
        console.error('Erro ao listar disciplinas:', error);
        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao listar disciplinas',
            erro: error.message,
        });
    }
};

module.exports = {
    listaDisciplinas,
};
