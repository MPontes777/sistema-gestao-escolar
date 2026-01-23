const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Retorna estatísticas para o dashboard
const getStats = async (req, res) => {
    try {
        const { perfil, id: userId } = req.user;

        let totalAlunos = 0;
        let totalTurmas = 0;
        let totalProfessores = null;

        // Retorna total de turmas atribuidas ao professor
        if (perfil === 'professor') {
            const AtribProf = await prisma.professorTurma.findMany({
                where: {
                    professorId: userId,
                    professor: { ativo: true },
                    turma: { ativo: true }
                },
                include: { turma: true }
            });

            const turmasIds = [...new Set(AtribProf.map(pt => pt.turma.id))];
            totalTurmas = turmasIds.length;
        
            //
            if (turmasIds.length > 0) {
                const alunosTurma = await prisma.aluno.findMany({
                    where: {
                        turmaId: { in: turmasIds },
                        ativo: true
                    },
                    select: { id: true }
                });
                totalAlunos = alunosTurma.length;
            }
        }

        if (perfil === 'admin') {
            totalAlunos = await prisma.aluno.count({
                where: { ativo: true }
            });
            totalTurmas = await prisma.turma.count({
                where: { ativo: true }
            });
            totalProfessores = await prisma.usuario.count({
                where: { perfil: 'professor', ativo: true }
            });
        }

        const stats = { totalAlunos, totalTurmas };
        if (perfil === 'admin') {
            stats.totalProfessores = totalProfessores;
        }

        res.status(200).json(stats);
    } catch (error) {
        console.error('Erro ao buscar estatísticas do dashboard:', error);
        res.status(500).json({ mensagem: 'Erro ao buscar estatísticas do dashboard' });
    }
};

module.exports = { getStats };