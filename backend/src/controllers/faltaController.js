const prisma = require('../utils/prisma');
const { buscaVinculos } = require('../utils/vinculos');
const { calculaPresenca } = require('../utils/aproveitamento');

// Lista vínculos professor-turma-disciplina (mesmo padrão de Planejamentos)
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

// Lista faltas
const listaFaltas = async (req, res) => {
    try {
        const { turmaId, disciplinaId, alunoId, planejamentoId, bimestre } = req.query;

        const where = {};

        // Controle de acesso
        const { perfil, id: userId } = req.user;

        switch (perfil) {
            case 'admin': // Admin vê todas as faltas
                break;

            case 'professor': // Professor vê apenas faltas dos seus próprios planejamentos
                where.planejamento = { professorId: userId };
                break;

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

        // Filtro por planejamento
        if (planejamentoId) {
            where.planejamentoId = planejamentoId;
        }

        // Filtros que dependem de campos do planejamento
        if (turmaId || disciplinaId || bimestre) {
            where.planejamento = {
                ...where.planejamento,
                ...(turmaId && { turmaId }),
                ...(disciplinaId && { disciplinaId }),
                ...(bimestre && { bimestre: parseInt(bimestre) }),
            };
        }

        const faltas = await prisma.falta.findMany({
            where,
            orderBy: {
                planejamento: {
                    data: 'desc',
                },
            },
            include: {
                aluno: {
                    select: {
                        id: true,
                        nome: true,
                        matricula: true,
                    },
                },
                planejamento: {
                    select: {
                        id: true,
                        titulo: true,
                        data: true,
                        numeroAulas: true,
                        bimestre: true,
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
                },
            },
        });

        return res.status(200).json({
            sucesso: true,
            mensagem: 'Faltas listadas',
            dados: faltas,
        });
    } catch (error) {
        console.error('Erro ao listar faltas:', error);
        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao listar faltas',
            erro: error.message,
        });
    }
};

// Lança faltas em lote
const criaFaltas = async (req, res) => {
    try {
        // Controle de acesso
        switch (req.user.perfil) {
            case 'professor':
                break;
            default:
                return res.status(403).json({
                    sucesso: false,
                    mensagem: 'Apenas professores podem lançar faltas',
                });
        }

        const { registros } = req.body;
        const { id: userId, nome: userNome } = req.user;

        // Valida formato
        if (!Array.isArray(registros) || registros.length === 0) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Envie ao menos um registro de falta',
            });
        }

        // Valida campos obrigatórios
        for (const registro of registros) {
            const { alunoId, planejamentoId, quantidadeFaltas } = registro;

            if (
                !alunoId ||
                !planejamentoId ||
                quantidadeFaltas === undefined ||
                quantidadeFaltas === null ||
                quantidadeFaltas === ''
            ) {
                return res.status(400).json({
                    sucesso: false,
                    mensagem: 'Cada registro deve conter alunoId, planejamentoId e quantidadeFaltas',
                });
            }
        }

        // Busca planejamentos
        const planejamentoIds = [...new Set(registros.map((r) => r.planejamentoId))];

        const planejamentos = await prisma.planejamento.findMany({
            where: {
                id: {
                    in: planejamentoIds,
                },
            },
            select: {
                id: true,
                professorId: true,
                turmaId: true,
                numeroAulas: true,
                titulo: true,
            },
        });

        const planejamentosMap = new Map(planejamentos.map((p) => [p.id, p]));

        // Verifica se planejamento existe
        for (const planejamentoId of planejamentoIds) {
            const planejamento = planejamentosMap.get(planejamentoId);

            if (!planejamento) {
                return res.status(404).json({
                    sucesso: false,
                    mensagem: `Planejamento ${planejamentoId} não encontrado`,
                });
            }

            if (planejamento.professorId !== userId) {
                return res.status(403).json({
                    sucesso: false,
                    mensagem: `Você não tem permissão para lançar faltas no planejamento "${planejamento.titulo}"`,
                });
            }
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

        // Valida registro
        for (const registro of registros) {
            const { alunoId, planejamentoId, quantidadeFaltas } = registro;

            const aluno = alunosMap.get(alunoId);
            const planejamento = planejamentosMap.get(planejamentoId);

            if (!aluno) {
                return res.status(404).json({
                    sucesso: false,
                    mensagem: `Aluno ${alunoId} não encontrado`,
                });
            }

            if (aluno.turmaId !== planejamento.turmaId) {
                return res.status(400).json({
                    sucesso: false,
                    mensagem: `O aluno "${aluno.nome}" não pertence à turma do planejamento "${planejamento.titulo}"`,
                });
            }

            const quantidadeInt = parseInt(quantidadeFaltas);
            if (isNaN(quantidadeInt) || quantidadeInt < 0 || quantidadeInt > planejamento.numeroAulas) {
                return res.status(400).json({
                    sucesso: false,
                    mensagem: `Quantidade de faltas para "${aluno.nome}" deve ser entre 0 e ${planejamento.numeroAulas} (número de aulas de "${planejamento.titulo}")`,
                });
            }
        }

        // Busca faltas já existentes
        const faltasExistentes = await prisma.falta.findMany({
            where: {
                alunoId: {
                    in: alunoIds,
                },
                planejamentoId: {
                    in: planejamentoIds,
                },
            },
        });

        const faltasExistentesMap = new Map(faltasExistentes.map((f) => [`${f.alunoId}_${f.planejamentoId}`, f]));

        // Cria auditoria
        const faltasSalvas = await prisma.$transaction(async (tx) => {
            const salvas = [];

            for (const registro of registros) {
                const { alunoId, planejamentoId } = registro;
                const quantidadeInt = parseInt(registro.quantidadeFaltas);

                const aluno = alunosMap.get(alunoId);
                const planejamento = planejamentosMap.get(planejamentoId);
                const chave = `${alunoId}_${planejamentoId}`;
                const faltaExistente = faltasExistentesMap.get(chave);

                const falta = await tx.falta.upsert({
                    where: {
                        alunoId_planejamentoId: {
                            alunoId,
                            planejamentoId,
                        },
                    },
                    create: {
                        alunoId,
                        planejamentoId,
                        quantidadeFaltas: quantidadeInt,
                    },
                    update: {
                        quantidadeFaltas: quantidadeInt,
                    },
                });

                await tx.auditLog.create({
                    data: {
                        usuarioId: userId,
                        usuarioNome: userNome,
                        tabela: 'faltas',
                        registroId: falta.id,
                        operacao: faltaExistente ? 'UPDATE' : 'CREATE',
                        descricao: faltaExistente
                            ? `Falta de "${aluno.nome}" no planejamento "${planejamento.titulo}" atualizada por ${userNome}: ${faltaExistente.quantidadeFaltas} → ${quantidadeInt} aula(s)`
                            : `Falta de "${aluno.nome}" no planejamento "${planejamento.titulo}" lançada por ${userNome} - ${quantidadeInt}/${planejamento.numeroAulas} aula(s)`,
                        valorAnterior: faltaExistente ? { quantidadeFaltas: faltaExistente.quantidadeFaltas } : null,
                        valorNovo: { quantidadeFaltas: quantidadeInt },
                    },
                });

                salvas.push(falta);
            }

            return salvas;
        });

        return res.status(201).json({
            sucesso: true,
            mensagem: 'Faltas lançadas com sucesso',
            dados: faltasSalvas,
        });
    } catch (error) {
        console.error('Erro ao lançar faltas:', error);
        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao lançar faltas',
            erro: error.message,
        });
    }
};

// Edita justificativa de uma falta (apenas admin)
const editaFalta = async (req, res) => {
    try {
        // Controle de acesso
        switch (req.user.perfil) {
            case 'admin':
                break;
            default:
                return res.status(403).json({
                    sucesso: false,
                    mensagem: 'Apenas o administrador pode justificar faltas',
                });
        }

        const { id } = req.params;
        const { justificativa } = req.body;
        const { id: userId, nome: userNome } = req.user;

        // Verifica se a falta existe
        const faltaExiste = await prisma.falta.findUnique({
            where: { id },
            include: {
                aluno: {
                    select: {
                        nome: true,
                    },
                },
                planejamento: {
                    select: {
                        titulo: true,
                    },
                },
            },
        });

        if (!faltaExiste) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Falta não encontrada',
            });
        }

        // Valida justificativa
        if (justificativa !== undefined && justificativa !== null && justificativa.trim().length > 500) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Justificativa deve ter no máximo 500 caracteres',
            });
        }

        // Vazio ou null = remover justificativa (não é erro)
        const justificativaNova = justificativa?.trim() || null;

        // Detecta alteração
        if (justificativaNova === faltaExiste.justificativa) {
            return res.status(200).json({
                sucesso: true,
                mensagem: 'Nenhuma alteração detectada',
                dados: faltaExiste,
            });
        }

        // Atualiza com auditoria
        const faltaAtualizada = await prisma.$transaction(async (tx) => {
            const atualizada = await tx.falta.update({
                where: { id },
                data: { justificativa: justificativaNova },
            });

            await tx.auditLog.create({
                data: {
                    usuarioId: userId,
                    usuarioNome: userNome,
                    tabela: 'faltas',
                    registroId: id,
                    operacao: 'UPDATE',
                    descricao: `Justificativa da falta de "${faltaExiste.aluno.nome}" no planejamento "${faltaExiste.planejamento.titulo}" atualizada por ${userNome}`,
                    valorAnterior: faltaExiste.justificativa,
                    valorNovo: justificativaNova,
                },
            });

            return atualizada;
        });

        return res.status(200).json({
            sucesso: true,
            mensagem: 'Justificativa atualizada com sucesso',
            dados: faltaAtualizada,
        });
    } catch (error) {
        console.error('Erro ao editar falta:', error);
        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao editar falta',
            erro: error.message,
        });
    }
};

// Calcula o aproveitamento de um aluno em uma disciplina
const calculaAproveitamento = async (req, res) => {
    try {
        const { alunoId, disciplinaId, bimestre } = req.query;
        const { perfil, id: userId } = req.user;

        if (!alunoId || !disciplinaId) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Informe alunoId e disciplinaId para calcular o aproveitamento',
            });
        }

        // Verifica se o aluno existe
        const aluno = await prisma.aluno.findUnique({
            where: {
                id: alunoId,
            },
            select: {
                id: true,
                nome: true,
                turmaId: true,
            },
        });

        if (!aluno) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Aluno não encontrado',
            });
        }

        // Monta filtro dos planejamentos
        const wherePlanejamento = {
            turmaId: aluno.turmaId,
            disciplinaId,
        };

        switch (perfil) {
            case 'admin': // Admin considera todos os planejamentos da turma
                break;

            case 'professor': // Professor considera apenas os próprios planejamentos
                wherePlanejamento.professorId = userId;
                break;

            default:
                return res.status(403).json({
                    sucesso: false,
                    mensagem: 'Acesso não autorizado',
                });
        }

        if (bimestre) wherePlanejamento.bimestre = parseInt(bimestre);

        let totalAulas, totalFaltas, percentualPresenca;

        // Busca planejamentos
        if (wherePlanejamento.professorId || wherePlanejamento.bimestre) {
            const planejamentos = await prisma.planejamento.findMany({
                where: wherePlanejamento,
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

            totalAulas = planejamentos.reduce((soma, p) => soma + p.numeroAulas, 0);
            totalFaltas = planejamentos.reduce((soma, p) => {
                const falta = p.faltas[0];
                return soma + (falta ? falta.quantidadeFaltas : 0);
            }, 0);

            percentualPresenca =
                totalAulas === 0 ? null : Number((((totalAulas - totalFaltas) / totalAulas) * 100).toFixed(1));
        } else {
            ({ totalAulas, totalFaltas, percentualPresenca } = await calculaPresenca({
                alunoId,
                turmaId: aluno.turmaId,
                disciplinaId,
            }));
        }

        return res.status(200).json({
            sucesso: true,
            mensagem: 'Aproveitamento calculado',
            dados: {
                aluno: {
                    id: aluno.id,
                    nome: aluno.nome,
                },
                totalAulas,
                totalFaltas,
                percentualPresenca,
            },
        });
    } catch (error) {
        console.error('Erro ao calcular aproveitamento:', error);
        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao calcular aproveitamento',
            erro: error.message,
        });
    }
};

module.exports = {
    listaVinculos,
    listaFaltas,
    criaFaltas,
    editaFalta,
    calculaAproveitamento,
};
