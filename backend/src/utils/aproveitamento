const prisma = require('./prisma');

// Calcula presença de um aluno numa disciplina
async function calculaPresenca({ alunoId, turmaId, disciplinaId }) {
    const planejamentos = await prisma.planejamento.findMany({
        where: {
            turmaId,
            disciplinaId,
        },
        select: {
            id: true,
            numeroAulas: true,
            faltas: {
                where: {
                    alunoId,
                },
                select: {
                    quantidadeFaltas: true,
                },
            },
        },
    });

    const totalAulas = planejamentos.reduce((soma, p) => soma + p.numeroAulas, 0);
    const totalFaltas = planejamentos.reduce((soma, p) => {
        const falta = p.faltas[0];
        return soma + (falta ? falta.quantidadeFaltas : 0);
    }, 0);

    const percentualPresenca =
        totalAulas === 0 ? null : Number((((totalAulas - totalFaltas) / totalAulas) * 100).toFixed(1));

    return { totalAulas, totalFaltas, percentualPresenca };
}

module.exports = { calculaPresenca };
