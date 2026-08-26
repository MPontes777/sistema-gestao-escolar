const prisma = require('../utils/prisma');
const { buscaVinculos } = require('../utils/vinculos');

// Lista vínculos professor-turma-disciplina
const listaVinculos = async (req, res) => {
    try {
        const resultado = await buscaVinculos(req.user);

        if (resultado.erro) {
            return res.status(resultado.status).json({
                sucesso: false,
                mensagem: resultado.mensagem,
            });
        }

        return res.status(200).json({
            sucesso: true,
            mensagem: 'Vínculos listados',
            dados: resultado.dados,
        });
    } catch (error) {
        console.error('Erro ao listar vínculos:', error);
        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao listar vínculos',
            erro: error.message,
        });
    }
};

// Lista notas
const listaNotas = async (req, res) => {
    try {
        const { turmaId, disciplinaId, alunoId } = req.query;
        const { perfil } = req.user;

        const where = {};

        // Controle de acesso
        switch (perfil) {
            case 'admin': // Admin vê todas as notas
                break;

            case 'professor': {
                // Professor só vê notas das turmas e disciplinas que ele leciona
                const resultado = await buscaVinculos(req.user);

                if (resultado.erro) {
                    return res.status(resultado.status).json({
                        sucesso: false,
                        mensagem: resultado.mensagem,
                    });
                }

                const { vinculos } = resultado.dados;

                if (vinculos.length === 0) {
                    return res.status(200).json({
                        sucesso: true,
                        mensagem: 'Notas listadas',
                        dados: [],
                    });
                }

                where.OR = vinculos.map((v) => ({
                    disciplinaId: v.disciplinaId,
                    aluno: {
                        turmaId: v.turmaId,
                    },
                }));
                break;
            }

            default:
                return res.status(403).json({
                    sucesso: false,
                    mensagem: 'Acesso não autorizado',
                });
        }

        // Filtro por aluno
        if (alunoId) {
            where.alunoId = alunoId;
        }

        // Filtro por disciplina
        if (disciplinaId) {
            where.disciplinaId = disciplinaId;
        }

        // Filtro por turma
        if (turmaId) {
            where.aluno = { ...where.aluno, turmaId };
        }

        const notas = await prisma.nota.findMany({
            where,
            orderBy: {
                aluno: {
                    nome: 'asc',
                },
            },
            include: {
                aluno: {
                    select: {
                        id: true,
                        nome: true,
                        matricula: true,
                        turmaId: true,
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

        return res.status(200).json({
            sucesso: true,
            mensagem: 'Notas listadas',
            dados: notas,
        });
    } catch (error) {
        console.error('Erro ao listar notas:', error);
        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao listar notas',
            erro: error.message,
        });
    }
};

// Lança e atualiza notas
const criaNotas = async (req, res) => {
    try {
        // Controle de acesso
        const { perfil, id: userId, nome: userNome } = req.user;

        switch (perfil) {
            case 'admin':
            case 'professor':
                break;
            default:
                return res.status(403).json({
                    sucesso: false,
                    mensagem: 'Acesso não autorizado',
                });
        }

        const { registros } = req.body;
        const camposBimestre = ['bimestre1', 'bimestre2', 'bimestre3', 'bimestre4'];

        // Valida formato
        if (!Array.isArray(registros) || registros.length === 0) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Envie ao menos um registro de nota',
            });
        }

        // Valida campos obrigatórios e valores de cada registro
        for (const registro of registros) {
            const { alunoId, disciplinaId } = registro;

            if (!alunoId || !disciplinaId) {
                return res.status(400).json({
                    sucesso: false,
                    mensagem: 'Cada registro deve conter alunoId e disciplinaId',
                });
            }

            const camposEnviados = camposBimestre.filter((campo) => registro[campo] !== undefined);

            if (camposEnviados.length === 0) {
                return res.status(400).json({
                    sucesso: false,
                    mensagem: 'Cada registro deve conter ao menos um bimestre',
                });
            }

            for (const campo of camposEnviados) {
                const valor = registro[campo];

                // Permite limpar um bimestre
                if (valor === null) continue;

                const valorNum = parseFloat(valor);
                if (isNaN(valorNum) || valorNum < 0 || valorNum > 10) {
                    return res.status(400).json({
                        sucesso: false,
                        mensagem: `${campo} deve ser um valor entre 0 e 10`,
                    });
                }
            }
        }

        // Busca vínculos
        let vinculosValidos = null;
        if (perfil === 'professor') {
            const resultado = await buscaVinculos(req.user);

            if (resultado.erro) {
                return res.status(resultado.status).json({
                    sucesso: false,
                    mensagem: resultado.mensagem,
                });
            }

            // Turma e disciplina válidas para busca
            vinculosValidos = new Set(resultado.dados.vinculos.map((v) => `${v.turmaId}|${v.disciplinaId}`));
        }

        // Busca alunos
        const alunoIds = [...new Set(registros.map((r) => r.alunoId))];
        const alunos = await prisma.aluno.findMany({
            where: {
                id: {
                    in: alunoIds,
                },
            },
            select: {
                id: true,
                nome: true,
                turmaId: true,
            },
        });
        const alunosMap = new Map(alunos.map((a) => [a.id, a]));

        // Busca disciplinas
        const disciplinaIds = [...new Set(registros.map((r) => r.disciplinaId))];
        const disciplinas = await prisma.disciplina.findMany({
            where: {
                id: {
                    in: disciplinaIds,
                },
            },
            select: {
                id: true,
                nome: true,
            },
        });
        const disciplinasMap = new Map(disciplinas.map((d) => [d.id, d]));

        // Valida existência e vínculo de cada registro
        for (const registro of registros) {
            const { alunoId, disciplinaId } = registro;

            const aluno = alunosMap.get(alunoId);
            const disciplina = disciplinasMap.get(disciplinaId);

            if (!aluno) {
                return res.status(404).json({
                    sucesso: false,
                    mensagem: `Aluno ${alunoId} não encontrado`,
                });
            }

            if (!disciplina) {
                return res.status(404).json({
                    sucesso: false,
                    mensagem: `Disciplina ${disciplinaId} não encontrada`,
                });
            }

            if (perfil === 'professor') {
                const par = `${aluno.turmaId}|${disciplinaId}`;
                if (!vinculosValidos.has(par)) {
                    return res.status(403).json({
                        sucesso: false,
                        mensagem: `Você não tem permissão para lançar notas de "${disciplina.nome}" para o aluno "${aluno.nome}"`,
                    });
                }
            }
        }

        // Busca notas já existentes (para upsert e valorAnterior)
        const notasExistentes = await prisma.nota.findMany({
            where: {
                OR: registros.map((r) => ({ alunoId: r.alunoId, disciplinaId: r.disciplinaId })),
            },
        });
        const notasMap = new Map(notasExistentes.map((n) => [`${n.alunoId}_${n.disciplinaId}`, n]));

        // Cria auditoria
        const notasSalvas = await prisma.$transaction(async (tx) => {
            const salvas = [];

            for (const registro of registros) {
                const { alunoId, disciplinaId } = registro;
                const aluno = alunosMap.get(alunoId);
                const disciplina = disciplinasMap.get(disciplinaId);
                const chave = `${alunoId}_${disciplinaId}`;
                const notaExistente = notasMap.get(chave);

                // Apenas campos de bimestre enviados
                const dadosAtualizacao = {};
                const valorAnterior = {};
                const valorNovo = {};

                for (const campo of camposBimestre) {
                    if (registro[campo] === undefined) continue;

                    const valorFinal = registro[campo] === null ? null : parseFloat(registro[campo]);
                    dadosAtualizacao[campo] = valorFinal;
                    valorAnterior[campo] = notaExistente ? notaExistente[campo] : null;
                    valorNovo[campo] = valorFinal;
                }

                let nota;
                if (notaExistente) {
                    nota = await tx.nota.update({
                        where: {
                            id: notaExistente.id,
                        },
                        data: dadosAtualizacao,
                    });
                } else {
                    nota = await tx.nota.create({
                        data: {
                            alunoId,
                            disciplinaId,
                            ...dadosAtualizacao,
                        },
                    });
                }

                await tx.auditLog.create({
                    data: {
                        usuarioId: userId,
                        usuarioNome: userNome,
                        tabela: 'notas',
                        registroId: nota.id,
                        operacao: notaExistente ? 'UPDATE' : 'CREATE',
                        descricao: notaExistente
                            ? `Nota de "${aluno.nome}" em "${disciplina.nome}" atualizada por ${userNome} (${Object.keys(dadosAtualizacao).join(', ')})`
                            : `Nota de "${aluno.nome}" em "${disciplina.nome}" lançada por ${userNome} (${Object.keys(dadosAtualizacao).join(', ')})`,
                        valorAnterior,
                        valorNovo,
                    },
                });

                salvas.push(nota);
            }

            return salvas;
        });

        return res.status(201).json({
            sucesso: true,
            mensagem: 'Notas lançadas com sucesso',
            dados: notasSalvas,
        });
    } catch (error) {
        console.error('Erro ao lançar notas:', error);
        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao lançar notas',
            erro: error.message,
        });
    }
};

module.exports = {
    listaVinculos,
    listaNotas,
    criaNotas,
};
