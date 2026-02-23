const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Lista todas as turmas
async function listaTurmas(req, res) {
    try {
        const { status } = req.query;

        // Filtro
        const where = {};
        if (status === 'ativo') {
            where.ativo = true;
        } else if (status === 'inativo') {
            where.ativo = false;
        }

        // Consulta turmas
        const turmas = await prisma.turma.findMany({
            where,
            select: {
                id: true,
                nomeCompleto: true,
                periodo: true,
                anoLetivo: true,
            },
            orderBy: { nomeCompleto: 'asc' },
        });

        return res.status(200).json({
            mensagem: 'Turmas listadas',
            turmas,
        });
    } catch {
        console.error('Erro ao listar turmas:', error);
        return res.status(500).json({
            mensagem: 'Erro ao listar turmas',
        });
    }
}

module.exports = {
    listaTurmas,
};
