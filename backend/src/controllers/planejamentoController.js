const prisma = require('../utils/prisma');
const { validaData } = require('../utils/validacoes');

// Valida campos obrigatórios do planejamento
async function validaCamposPlanejamento(body, res) {
    const { turmaId, disciplinaId, titulo, data } = body;

    // Campos obrigatórios
    if (!turmaId || !disciplinaId || !titulo || !data) {
        res.status(400).json({
            sucesso: false,
            mensagem: 'Campos obrigatórios: Turma, Disciplina, Título e Data',
        });
        return null;
    }

    // Valida título
    if (titulo.trim().length === 0) {
        res.status(400).json({
            sucesso: false,
            mensagem: 'Título não pode ser vazio',
        });
        return null;
    }

    if (titulo.trim().length > 200) {
        res.status(400).json({
            sucesso: false,
            mensagem: 'Título deve conter no máximo 200 caracteres',
        });
        return null;
    }

    // Valida data
    const resultadoData = validaData(data);
    if (!resultadoData.valido) {
        res.status(400).json({
            sucesso: false,
            mensagem: resultadoData.mensagem,
        });
        return null;
    }

    // Verifica se a turma existe e está ativa
    const turma = await prisma.turma.findUnique({
        where: { id: turmaId },
        select: { id: true, nomeCompleto: true, ativo: true },
    });

    if (!turma) {
        res.status(400).json({
            sucesso: false,
            mensagem: 'Turma não encontrada',
        });
        return null;
    }

    if (!turma.ativo) {
        res.status(400).json({
            sucesso: false,
            mensagem: 'Não é possível criar planejamento para uma turma inativa',
        });
        return null;
    }

    // Verifica se a disciplina existe e está ativa
    const disciplina = await prisma.disciplina.findUnique({
        where: { id: disciplinaId },
        select: { id: true, nome: true, ativo: true },
    });

    if (!disciplina) {
        res.status(400).json({
            sucesso: false,
            mensagem: 'Disciplina não encontrada',
        });
        return null;
    }

    if (!disciplina.ativo) {
        res.status(400).json({
            sucesso: false,
            mensagem: 'Não é possível criar planejamento para uma disciplina inativa',
        });
        return null;
    }

    return { turmaId, disciplinaId, titulo: titulo.trim(), data: resultadoData.dataObj, turma, disciplina };
}

// Lista planejamentos
const listaPlanejamentos = async (req, res) => {
    try {
        const {
            turmaId,
            disciplinaId,
            dataInicio,
            dataFim,
            titulo,
            ordenarPor = 'data',
            ordem = 'desc',
            limit = 10,
            offset = 0,
        } = req.query;

        const where = {};

        // Controle de acesso
        const { perfil, id: userId } = req.user;

        switch (perfil) {
            case 'admin':
                // Admin vê todos os planejamentos
                break;

            case 'professor':
                // Professor vê apenas seus próprios planejamentos
                where.professorId = userId;
                break;

            default:
                return res.status(403).json({
                    sucesso: false,
                    mensagem: 'Acesso não autorizado',
                });
        }

        // Filtro por turma
        if (turmaId) {
            where.turmaId = turmaId;
        }

        // Filtro por disciplina
        if (disciplinaId) {
            where.disciplinaId = disciplinaId;
        }

        // Filtro por título (busca parcial)
        if (titulo) {
            where.titulo = { contains: titulo, mode: 'insensitive' };
        }

        // Filtro por intervalo de datas
        if (dataInicio || dataFim) {
            where.data = {};
            if (dataInicio) {
                where.data.gte = new Date(dataInicio);
            }
            if (dataFim) {
                const fim = new Date(dataFim);
                fim.setHours(23, 59, 59, 999);
                where.data.lte = fim;
            }
        }

        // Ordenação
        const camposValidos = ['data', 'titulo', 'createdAt'];
        const ordenacao = camposValidos.includes(ordenarPor) ? ordenarPor : 'data';
        const direcao = ordem === 'asc' ? 'asc' : 'desc';

        // Consulta planejamentos filtrados
        const planejamentos = await prisma.planejamento.findMany({
            where,
            orderBy: { [ordenacao]: direcao },
            take: parseInt(limit),
            skip: parseInt(offset),
            include: {
                professor: {
                    select: { id: true, nome: true },
                },
                turma: {
                    select: { id: true, nomeCompleto: true },
                },
                disciplina: {
                    select: { id: true, nome: true },
                },
            },
        });

        // Conta total para paginação
        const total = await prisma.planejamento.count({ where });

        return res.status(200).json({
            sucesso: true,
            mensagem: 'Planejamentos listados',
            dados: {
                planejamentos,
                paginacao: {
                    total,
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    totalPaginas: Math.ceil(total / parseInt(limit)),
                },
            },
        });
    } catch (error) {
        console.error('Erro ao listar planejamentos:', error);
        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao listar planejamentos',
            erro: error.message,
        });
    }
};

// Busca planejamento por ID
const buscaPlanejamentoId = async (req, res) => {
    try {
        const { id } = req.params;

        const planejamento = await prisma.planejamento.findUnique({
            where: { id },
            include: {
                professor: {
                    select: { id: true, nome: true, email: true },
                },
                turma: {
                    select: { id: true, nomeCompleto: true },
                },
                disciplina: {
                    select: { id: true, nome: true },
                },
            },
        });

        if (!planejamento) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Planejamento não encontrado',
            });
        }

        // Controle de acesso
        const { perfil, id: userId } = req.user;

        switch (perfil) {
            case 'admin':
                // Admin acessa qualquer planejamento
                break;

            case 'professor':
                // Professor acessa apenas seus próprios planejamentos
                if (planejamento.professorId !== userId) {
                    return res.status(403).json({
                        sucesso: false,
                        mensagem: 'Você não tem permissão para visualizar este planejamento',
                    });
                }
                break;

            default:
                return res.status(403).json({
                    sucesso: false,
                    mensagem: 'Acesso não autorizado',
                });
        }

        return res.status(200).json({
            sucesso: true,
            mensagem: 'Planejamento encontrado',
            dados: planejamento,
        });
    } catch (error) {
        console.error('Erro ao buscar planejamento:', error);
        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao buscar planejamento',
            erro: error.message,
        });
    }
};

// Cria planejamento (apenas professor)
const criaPlanejamento = async (req, res) => {
    try {
        // Controle de acesso
        switch (req.user.perfil) {
            case 'professor':
                break;
            default:
                return res.status(403).json({
                    sucesso: false,
                    mensagem: 'Apenas professores podem criar planejamentos',
                });
        }

        // Valida campos
        const campos = await validaCamposPlanejamento(req.body, res);
        if (!campos) return;

        const { turmaId, disciplinaId, titulo, data, turma, disciplina } = campos;
        const { objetivo, conteudo, metodologia } = req.body;
        const { id: userId } = req.user;

        // Verifica se o professor está vinculado a esta turma e disciplina
        const vinculo = await prisma.professorTurma.findFirst({
            where: { professorId: userId, turmaId, disciplinaId },
        });

        if (!vinculo) {
            return res.status(403).json({
                sucesso: false,
                mensagem: 'Você não está vinculado a esta turma/disciplina',
            });
        }

        // Cria planejamento com auditoria
        const garantia = await prisma.$transaction(async (tx) => {
            const novoPlanejamento = await tx.planejamento.create({
                data: {
                    professorId: userId,
                    turmaId,
                    disciplinaId,
                    titulo,
                    objetivo: objetivo?.trim() || null,
                    conteudo: conteudo?.trim() || null,
                    metodologia: metodologia?.trim() || null,
                    data,
                },
                include: {
                    professor: { select: { id: true, nome: true } },
                    turma: { select: { id: true, nomeCompleto: true } },
                    disciplina: { select: { id: true, nome: true } },
                },
            });

            await tx.auditLog.create({
                data: {
                    usuarioId: req.user.id,
                    usuarioNome: req.user.nome,
                    tabela: 'planejamentos',
                    registroId: novoPlanejamento.id,
                    operacao: 'CREATE',
                    descricao: `Planejamento "${novoPlanejamento.titulo}" criado por ${req.user.nome} para a turma ${turma.nomeCompleto} — ${disciplina.nome}`,
                    valorAnterior: null,
                    valorNovo: {
                        titulo: novoPlanejamento.titulo,
                        turmaId: novoPlanejamento.turmaId,
                        disciplinaId: novoPlanejamento.disciplinaId,
                        data: novoPlanejamento.data,
                    },
                },
            });

            return novoPlanejamento;
        });

        return res.status(201).json({
            sucesso: true,
            mensagem: 'Planejamento criado com sucesso',
            dados: garantia,
        });
    } catch (error) {
        console.error('Erro ao criar planejamento:', error);
        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao criar planejamento',
            erro: error.message,
        });
    }
};

// Edita planejamento (apenas o professor dono do planejamento)
const editaPlanejamento = async (req, res) => {
    try {
        // Controle de acesso
        switch (req.user.perfil) {
            case 'professor':
                break;
            default:
                return res.status(403).json({
                    sucesso: false,
                    mensagem: 'Apenas professores podem editar planejamentos',
                });
        }

        const { id } = req.params;
        const { id: userId } = req.user;

        // Verifica se o planejamento existe
        const planejamentoExiste = await prisma.planejamento.findUnique({
            where: { id },
        });

        if (!planejamentoExiste) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Planejamento não encontrado',
            });
        }

        // Verifica se o professor é dono do planejamento
        if (planejamentoExiste.professorId !== userId) {
            return res.status(403).json({
                sucesso: false,
                mensagem: 'Você não tem permissão para editar este planejamento',
            });
        }

        const { titulo, objetivo, conteudo, metodologia, data } = req.body;

        // Valida data
        let resultadoData;
        if (data !== undefined) {
            resultadoData = validaData(data);
            if (!resultadoData.valido) {
                return res.status(400).json({
                    sucesso: false,
                    mensagem: resultadoData.mensagem,
                });
            }
        }

        // Detecta alterações
        const semAlteracao =
            (titulo === undefined || titulo?.trim() === planejamentoExiste.titulo) &&
            (objetivo === undefined || (objetivo?.trim() || null) === planejamentoExiste.objetivo) &&
            (conteudo === undefined || (conteudo?.trim() || null) === planejamentoExiste.conteudo) &&
            (metodologia === undefined || (metodologia?.trim() || null) === planejamentoExiste.metodologia) &&
            (data === undefined || new Date(data).toISOString() === planejamentoExiste.data.toISOString());

        if (semAlteracao) {
            return res.status(200).json({
                sucesso: true,
                mensagem: 'Nenhuma alteração detectada',
                dados: planejamentoExiste,
            });
        }

        // Valida campos se fornecidos
        if (titulo !== undefined) {
            if (titulo.trim().length === 0) {
                return res.status(400).json({
                    sucesso: false,
                    mensagem: 'Título não pode ser vazio',
                });
            }
            if (titulo.trim().length > 200) {
                return res.status(400).json({
                    sucesso: false,
                    mensagem: 'Título deve ter no máximo 200 caracteres',
                });
            }
        }

        // Monta apenas os campos que foram enviados
        const dadosAtualizacao = {};
        if (titulo !== undefined) dadosAtualizacao.titulo = titulo.trim();
        if (objetivo !== undefined) dadosAtualizacao.objetivo = objetivo?.trim() || null;
        if (conteudo !== undefined) dadosAtualizacao.conteudo = conteudo?.trim() || null;
        if (metodologia !== undefined) dadosAtualizacao.metodologia = metodologia?.trim() || null;
        if (data !== undefined) dadosAtualizacao.data = resultadoData.dataObj;

        // Atualiza com auditoria
        const garantia = await prisma.$transaction(async (tx) => {
            const planejamentoAtualizado = await tx.planejamento.update({
                where: { id },
                data: dadosAtualizacao,
                include: {
                    professor: { select: { id: true, nome: true } },
                    turma: { select: { id: true, nomeCompleto: true } },
                    disciplina: { select: { id: true, nome: true } },
                },
            });

            await tx.auditLog.create({
                data: {
                    usuarioId: req.user.id,
                    usuarioNome: req.user.nome,
                    tabela: 'planejamentos',
                    registroId: planejamentoAtualizado.id,
                    operacao: 'UPDATE',
                    descricao: `Planejamento "${planejamentoAtualizado.titulo}" editado por ${req.user.nome}`,
                    valorAnterior: {
                        titulo: planejamentoExiste.titulo,
                        objetivo: planejamentoExiste.objetivo,
                        conteudo: planejamentoExiste.conteudo,
                        metodologia: planejamentoExiste.metodologia,
                        data: planejamentoExiste.data,
                    },
                    valorNovo: dadosAtualizacao,
                },
            });

            return planejamentoAtualizado;
        });

        return res.status(200).json({
            sucesso: true,
            mensagem: 'Planejamento atualizado com sucesso',
            dados: garantia,
        });
    } catch (error) {
        console.error('Erro ao editar planejamento:', error);
        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao editar planejamento',
            erro: error.message,
        });
    }
};

// Exclui planejamento (apenas o professor dono do planejamento)
const excluiPlanejamento = async (req, res) => {
    try {
        // Controle de acesso
        switch (req.user.perfil) {
            case 'professor':
                break;
            default:
                return res.status(403).json({
                    sucesso: false,
                    mensagem: 'Apenas professores podem excluir planejamentos',
                });
        }

        const { id } = req.params;
        const { id: userId } = req.user;

        const planejamentoExiste = await prisma.planejamento.findUnique({
            where: { id },
            include: {
                turma: { select: { nomeCompleto: true } },
                disciplina: { select: { nome: true } },
            },
        });

        if (!planejamentoExiste) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Planejamento não encontrado',
            });
        }

        // Verifica se o professor é dono do planejamento
        if (planejamentoExiste.professorId !== userId) {
            return res.status(403).json({
                sucesso: false,
                mensagem: 'Você não tem permissão para excluir este planejamento',
            });
        }

        // Exclui com auditoria
        await prisma.$transaction(async (tx) => {
            await tx.auditLog.create({
                data: {
                    usuarioId: req.user.id,
                    usuarioNome: req.user.nome,
                    tabela: 'planejamentos',
                    registroId: planejamentoExiste.id,
                    operacao: 'DELETE',
                    descricao: `Planejamento "${planejamentoExiste.titulo}" excluído por ${req.user.nome} — turma ${planejamentoExiste.turma.nomeCompleto}`,
                    valorAnterior: {
                        titulo: planejamentoExiste.titulo,
                        turmaId: planejamentoExiste.turmaId,
                        disciplinaId: planejamentoExiste.disciplinaId,
                        data: planejamentoExiste.data,
                    },
                    valorNovo: null,
                },
            });

            await tx.planejamento.delete({ where: { id } });
        });

        return res.status(200).json({
            sucesso: true,
            mensagem: 'Planejamento excluído com sucesso',
        });
    } catch (error) {
        console.error('Erro ao excluir planejamento:', error);
        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao excluir planejamento',
            erro: error.message,
        });
    }
};

module.exports = {
    listaPlanejamentos,
    buscaPlanejamentoId,
    criaPlanejamento,
    editaPlanejamento,
    excluiPlanejamento,
};
