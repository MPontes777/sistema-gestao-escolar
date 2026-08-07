const prisma = require('./prisma');

// Retorna turmas, disciplinas e vínculos Professor-Turma-Disciplina válidos
async function buscaVinculos(user) {
    const { perfil, id: userId } = user;

    const where = {};

    switch (perfil) {
        case 'admin': // Admin considera todos os vínculos existentes
            break;

        case 'professor':
            where.professorId = userId;
            break;

        default:
            return {
                erro: true,
                status: 403,
                mensagem: 'Acesso não autorizado',
            };
    }

    const vinculos = await prisma.professorTurma.findMany({
        where,
        select: {
            turmaId: true,
            disciplinaId: true,
            turma: {
                select: {
                    id: true,
                    nomeCompleto: true,
                },
            },
            disciplina: {
                select: {
                    id: true,
                    nome: true,
                },
            },
        },
    });

    // Remove duplicidades
    const turmasMap = new Map();
    const disciplinasMap = new Map();
    vinculos.forEach((v) => {
        turmasMap.set(v.turma.id, v.turma);
        disciplinasMap.set(v.disciplina.id, v.disciplina);
    });

    return {
        erro: false,
        dados: {
            turmas: [...turmasMap.values()],
            disciplinas: [...disciplinasMap.values()],
            vinculos: vinculos.map((v) => ({
                turmaId: v.turmaId,
                disciplinaId: v.disciplinaId,
            })),
        },
    };
}

module.exports = { buscaVinculos };
