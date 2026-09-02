const prisma = require('./prisma');

const notaAprovacao = 6.0;
const presencaMinima = 75;
const camposBimestre = ['bimestre1', 'bimestre2', 'bimestre3', 'bimestre4'];

// Calcula presença de um aluno em uma disciplina
async function calculaPresenca({ alunoId, turmaId, disciplinaId }) {
    const aluno = await prisma.aluno.findUnique({
        where: { id: alunoId },
        select: {
            createdAt: true,
            inativadoAt: true,
        },
    });

    // Período em que o aluno esteve/está matriculado
    const filtroData = {
        gte: aluno.createdAt,
        ...(aluno.inativadoAt ? { lte: aluno.inativadoAt } : {}),
    };

    const planejamentos = await prisma.planejamento.findMany({
        where: {
            turmaId,
            disciplinaId,
            data: filtroData,
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

// Calcula média parcial, média final e resultado
async function calculaResultadoAutomatico({ alunoId, turmaId, disciplinaId, valorBimestres }) {
    const valoresPreenchidos = camposBimestre
        .map((campo) => valorBimestres[campo])
        .filter((v) => v !== null && v !== undefined);

    const todosBimestresPreenchidos = valoresPreenchidos.length === camposBimestre.length;

    if (!todosBimestresPreenchidos) {
        const mediaParcial =
            valoresPreenchidos.length > 0
                ? Number((valoresPreenchidos.reduce((soma, v) => soma + v, 0) / valoresPreenchidos.length).toFixed(1))
                : null;

        return { mediaParcial, mediaFinal: null, resultado: 'Cursando' };
    }

    const mediaFinal = Number((valoresPreenchidos.reduce((soma, v) => soma + v, 0) / 4).toFixed(1));

    const { percentualPresenca } = await calculaPresenca({ alunoId, turmaId, disciplinaId });

    // Não reprova por falta se não tiver registro de presença/falta
    const presencaOk = percentualPresenca === null || percentualPresenca >= presencaMinima;

    const resultado = mediaFinal >= notaAprovacao && presencaOk ? 'Aprovado' : 'Reprovado';

    return { mediaParcial: null, mediaFinal, resultado };
}

module.exports = { calculaPresenca, calculaResultadoAutomatico };
