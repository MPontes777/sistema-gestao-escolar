const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { validaAnoLetivo, validaLetraTurma, validaPeriodo } = require('../utils/validacoes');

// Lista todas as turmas
const listaTurmas = async (req, res) => {
    try {
        const {
            status,
            etapa,
            anoLetivo,
            periodo,
            semAlunos,
            nome,
            ordenarPor = 'nomeCompleto', // Ordenação
            ordem = 'asc',
            limit = 10, // Quantidade por página
            offset = 0, // Pula uma certa quantidade de registros
        } = req.query;

        // Filtro
        const where = {};

        // Controle de acesso
        const { perfil, id: userId } = req.user;

        switch (perfil) {
            case 'admin': // Admin acessa todas as turmas
                break;

            case 'professor': // Professor acessa apenas turmas que está atribuído
                const turmasProfessor = await prisma.professorTurma.findMany({
                    where: { professorId: userId },
                    select: { turmaId: true },
                });

                const turmaIdsProfessor = turmasProfessor.map((pt) => pt.turmaId);

                if (turmaIdsProfessor.length === 0) {
                    return res.status(200).json({
                        sucesso: true,
                        mensagem: 'Nenhuma turma encontrada',
                        dados: {
                            turmas: [],
                            paginacao: {
                                total: 0,
                                limit: parseInt(limit),
                                offset: parseInt(offset),
                                totalPaginas: 0,
                            },
                        },
                    });
                }

                where.id = { in: turmaIdsProfessor };
                break;

            default:
                return res.status(403).json({
                    sucesso: false,
                    mensagem: 'Acesso não autorizado',
                });
        }

        // Filtro por status
        if (status === 'ativo') {
            where.inativadoAt = null;
        } else if (status === 'inativo') {
            where.inativadoAt = { not: null };
        }

        // Filtro por anoLetivo
        if (anoLetivo) {
            where.anoLetivo = parseInt(anoLetivo);
        }

        // Filtro por período
        if (periodo) {
            where.periodo = periodo;
        }

        // Filtro por etapa
        if (etapa) {
            where.anoSerie = { etapa };
        }

        // Filtro por turmas sem alunos
        if (semAlunos === 'true') {
            where.alunos = { none: {} };
        }

        // Filtro por nome
        if (nome) {
            where.nomeCompleto = { contains: nome, mode: 'insensitive' };
        }

        // Ordenação
        let orderBy = {};
        if (ordenarPor === 'anoSerie') {
            orderBy = [{ anoSerie: { ordem: ordem } }, { nomeCompleto: ordem }];
        } else {
            orderBy[ordenarPor] = ordem;
        }

        // Consulta turmas
        const turmas = await prisma.turma.findMany({
            where,
            orderBy,
            take: parseInt(limit),
            skip: parseInt(offset),
            include: {
                anoSerie: {
                    select: {
                        id: true,
                        nome: true,
                        etapa: true,
                        ordem: true,
                    },
                },
                alunos: {
                    select: { id: true, ativo: true },
                },
            },
        });

        // Conta total de turmas para paginação
        const total = await prisma.turma.count({ where });

        return res.status(200).json({
            sucesso: true,
            mensagem: 'Turmas listadas',
            dados: {
                turmas,
                paginacao: {
                    total,
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    totalPaginas: Math.ceil(total / parseInt(limit)),
                },
            },
        });
    } catch (error) {
        console.error('Erro ao listar turmas:', error);
        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao listar turmas',
            erro: error.message,
        });
    }
};

// Busca turma por ID
const buscaTurmaId = async (req, res) => {
    try {
        const { id } = req.params;

        const turma = await prisma.turma.findUnique({
            where: { id },
            include: {
                anoSerie: {
                    select: {
                        id: true,
                        nome: true,
                        etapa: true,
                    },
                },
                alunos: {
                    where: { ativo: true },
                    select: {
                        id: true,
                        matricula: true,
                        nome: true,
                        ativo: true,
                        dataNascimento: true,
                        email: true,
                    },
                    orderBy: { nome: 'asc' },
                },
                professorTurmas: {
                    include: {
                        professor: {
                            select: {
                                id: true,
                                nome: true,
                                email: true,
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
                _count: {
                    select: { alunos: true },
                },
            },
        });

        if (!turma) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Turma não encontrada',
            });
        }

        // Controle de acesso
        const { perfil, id: userId } = req.user;

        switch (perfil) {
            case 'admin': // Admin acessa todas as turmas
                break;

            case 'professor': // Professor acessa apenas turmas que está atribuído
                const vinculo = await prisma.professorTurma.findFirst({
                    where: {
                        professorId: userId,
                        turmaId: id,
                    },
                });

                if (!vinculo) {
                    return res.status(403).json({
                        sucesso: false,
                        mensagem: 'Você não tem permissão para visualizar esta turma',
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
            mensagem: 'Turma encontrada',
            dados: turma,
        });
    } catch (error) {
        console.error('Erro ao buscar turma:', error);
        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao buscar turma',
            erro: error.message,
        });
    }
};

// Valida campos
async function validaCamposTurma(body, res) {
    const { anoSerieId, letra, anoLetivo, periodo } = body;

    if (!anoSerieId || !anoLetivo || !periodo) {
        res.status(400).json({ mensagem: 'Campos obrigatórios: Ano/Série, Ano Letivo e Período' });
        return null;
    }

    const resultadoAnoLetivo = validaAnoLetivo(anoLetivo);
    if (!resultadoAnoLetivo.valido) {
        res.status(400).json({ mensagem: resultadoAnoLetivo.mensagem });
        return null;
    }

    const resultadoLetra = validaLetraTurma(letra);
    if (!resultadoLetra.valido) {
        res.status(400).json({ mensagem: resultadoLetra.mensagem });
        return null;
    }

    const resultadoPeriodo = validaPeriodo(periodo);
    if (!resultadoPeriodo.valido) {
        res.status(400).json({ mensagem: resultadoPeriodo.mensagem });
        return null;
    }

    const anoSerie = await prisma.anoSerie.findUnique({ where: { id: anoSerieId } });
    if (!anoSerie) {
        res.status(400).json({ mensagem: 'Ano/Série não encontrado' });
        return null;
    }

    return {
        anoSerieId,
        anoLetivoNum: resultadoAnoLetivo.anoLetivoNum,
        letraMaiuscula: resultadoLetra.letraMaiuscula,
        periodo,
        anoSerie,
    };
}

// Cria nova turma (apenas admin)
const criaTurma = async (req, res) => {
    try {
        // Controle de acesso
        switch (req.user.perfil) {
            case 'admin':
                break;
            default:
                return res.status(403).json({
                    sucesso: false,
                    mensagem: 'Apenas administradores podem criar turmas',
                });
        }

        // Valida campos
        const campos = await validaCamposTurma(req.body, res);
        if (!campos) return;

        const { anoSerieId, anoLetivoNum, letraMaiuscula, periodo, anoSerie } = campos;

        // Verifica duplicidade
        const turmaExiste = await prisma.turma.findFirst({
            where: {
                anoSerieId,
                letra: letraMaiuscula,
                anoLetivo: anoLetivoNum,
            },
        });

        // Gera nomeCompleto automaticamente
        const nomeCompleto = letraMaiuscula
            ? `${anoSerie.nome} ${letraMaiuscula} (${anoLetivoNum})`
            : `${anoSerie.nome} (${anoLetivoNum})`;

        if (turmaExiste) {
            return res.status(400).json({
                mensagem: `Turma ${nomeCompleto} já existe`,
            });
        }

        // Garante que em caso de erro, faça um rollback sem registrar a turma nem o log
        const garantia = await prisma.$transaction(async (tx) => {
            const novaTurma = await tx.turma.create({
                data: {
                    anoSerieId,
                    letra: letraMaiuscula,
                    anoLetivo: anoLetivoNum,
                    periodo,
                    nomeCompleto,
                    ativo: true,
                },
                include: {
                    anoSerie: {
                        select: {
                            id: true,
                            nome: true,
                            etapa: true,
                        },
                    },
                },
            });

            await tx.auditLog.create({
                data: {
                    usuarioId: req.user.id,
                    usuarioNome: req.user.nome,
                    tabela: 'turmas',
                    registroId: novaTurma.id,
                    operacao: 'CREATE',
                    descricao: `Turma ${novaTurma.nomeCompleto} foi criada por ${req.user.nome}`,
                    valorAnterior: null,
                    valorNovo: {
                        anoSerieId: novaTurma.anoSerieId,
                        letra: novaTurma.letra,
                        anoLetivo: novaTurma.anoLetivo,
                        periodo: novaTurma.periodo,
                        nomeCompleto: novaTurma.nomeCompleto,
                    },
                },
            });

            return novaTurma;
        });

        return res.status(201).json({
            sucesso: true,
            mensagem: 'Turma criada',
            dados: garantia,
        });
    } catch (error) {
        console.error('Erro ao criar turma:', error);
        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao criar turma',
            erro: error.message,
        });
    }
};

// Edita turma (apenas admin)
const editaTurma = async (req, res) => {
    try {
        const { id } = req.params;

        // Controle de acesso
        switch (req.user.perfil) {
            case 'admin':
                break;
            default:
                return res.status(403).json({
                    sucesso: false,
                    mensagem: 'Apenas administradores podem editar turmas',
                });
        }

        // Busca turma atual
        const turmaAtual = await prisma.turma.findUnique({ where: { id } });
        if (!turmaAtual) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Turma não encontrada',
            });
        }

        // Valida campos
        const campos = await validaCamposTurma(req.body, res);
        if (!campos) return;

        const { anoSerieId, anoLetivoNum, letraMaiuscula, periodo, anoSerie } = campos;

        // Verifica duplicidade (excluindo a própria turma)
        const turmaExiste = await prisma.turma.findFirst({
            where: {
                anoSerieId,
                letra: letraMaiuscula,
                anoLetivo: anoLetivoNum,
                id: { not: id },
            },
        });

        // Gera nomeCompleto automaticamente
        const nomeCompleto = letraMaiuscula
            ? `${anoSerie.nome} ${letraMaiuscula} (${anoLetivoNum})`
            : `${anoSerie.nome} (${anoLetivoNum})`;

        if (turmaExiste) {
            return res.status(400).json({
                mensagem: `Turma ${nomeCompleto} já existe`,
            });
        }

        // Verifica se tiveram mudanças
        const verificaMudanca =
            turmaAtual.anoSerieId !== anoSerieId ||
            turmaAtual.letra !== letraMaiuscula ||
            turmaAtual.anoLetivo !== anoLetivoNum ||
            turmaAtual.periodo !== periodo;

        if (!verificaMudanca) {
            return res.status(200).json({
                sucesso: true,
                mensagem: 'Nenhuma alteração detectada',
            });
        }

        // Garante que em caso de erro, faça um rollback sem editar a turma nem registrar o log
        const garantia = await prisma.$transaction(async (tx) => {
            const turmaEditada = await tx.turma.update({
                where: { id },
                data: {
                    anoSerieId,
                    letra: letraMaiuscula,
                    anoLetivo: anoLetivoNum,
                    periodo,
                    nomeCompleto,
                },
                include: {
                    anoSerie: {
                        select: {
                            id: true,
                            nome: true,
                            etapa: true,
                        },
                    },
                },
            });

            await tx.auditLog.create({
                data: {
                    usuarioId: req.user.id,
                    usuarioNome: req.user.nome,
                    tabela: 'turmas',
                    registroId: turmaEditada.id,
                    operacao: 'UPDATE',
                    descricao: `Turma ${turmaAtual.nomeCompleto} foi editada por ${req.user.nome}`,
                    valorAnterior: {
                        anoSerieId: turmaAtual.anoSerieId,
                        letra: turmaAtual.letra,
                        anoLetivo: turmaAtual.anoLetivo,
                        periodo: turmaAtual.periodo,
                        nomeCompleto: turmaAtual.nomeCompleto,
                    },
                    valorNovo: {
                        anoSerieId: turmaEditada.anoSerieId,
                        letra: turmaEditada.letra,
                        anoLetivo: turmaEditada.anoLetivo,
                        periodo: turmaEditada.periodo,
                        nomeCompleto: turmaEditada.nomeCompleto,
                    },
                },
            });

            return turmaEditada;
        });

        return res.status(200).json({
            sucesso: true,
            mensagem: 'Turma editada',
            dados: garantia,
        });
    } catch (error) {
        console.error('Erro ao editar turma:', error);
        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao editar turma',
            erro: error.message,
        });
    }
};

// Inativa turma (apenas admin)
const inativaTurma = async (req, res) => {
    try {
        const { id } = req.params;

        // Controle de acesso
        switch (req.user.perfil) {
            case 'admin':
                break;
            default:
                return res.status(403).json({
                    sucesso: false,
                    mensagem: 'Apenas administradores podem inativar turmas',
                });
        }

        const turmaExiste = await prisma.turma.findUnique({
            where: { id },
            select: {
                id: true,
                nomeCompleto: true,
                ativo: true,
            },
        });

        if (!turmaExiste) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Turma não encontrada',
            });
        }

        if (!turmaExiste.ativo) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Turma já está inativa',
            });
        }

        const garantia = await prisma.$transaction(async (tx) => {
            const turmaInativada = await tx.turma.update({
                where: { id },
                data: {
                    ativo: false,
                    inativadoAt: new Date(),
                },
            });

            await tx.auditLog.create({
                data: {
                    usuarioId: req.user.id,
                    usuarioNome: req.user.nome,
                    tabela: 'turmas',
                    registroId: turmaInativada.id,
                    operacao: 'INACTIVATE',
                    descricao: `Turma ${turmaExiste.nomeCompleto} foi inativada por ${req.user.nome}`,
                    valorAnterior: {
                        ativo: true,
                        inativadoAt: null,
                    },
                    valorNovo: {
                        ativo: false,
                        inativadoAt: turmaInativada.inativadoAt,
                    },
                },
            });

            return turmaInativada;
        });

        return res.status(200).json({
            sucesso: true,
            mensagem: 'Turma inativada',
            dados: garantia,
        });
    } catch (error) {
        console.error('Erro ao inativar turma:', error);
        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao inativar turma',
            erro: error.message,
        });
    }
};

// Reativa turma (apenas admin)
const reativaTurma = async (req, res) => {
    try {
        const { id } = req.params;

        // Controle de acesso
        switch (req.user.perfil) {
            case 'admin':
                break;
            default:
                return res.status(403).json({
                    sucesso: false,
                    mensagem: 'Apenas administradores podem reativar turmas',
                });
        }

        const turmaExiste = await prisma.turma.findUnique({
            where: { id },
            select: {
                id: true,
                nomeCompleto: true,
                ativo: true,
                inativadoAt: true,
            },
        });

        if (!turmaExiste) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Turma não encontrada',
            });
        }

        if (turmaExiste.ativo) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Turma já está ativa',
            });
        }

        const garantia = await prisma.$transaction(async (tx) => {
            const turmaReativada = await tx.turma.update({
                where: { id },
                data: {
                    ativo: true,
                    inativadoAt: null,
                },
            });

            await tx.auditLog.create({
                data: {
                    usuarioId: req.user.id,
                    usuarioNome: req.user.nome,
                    tabela: 'turmas',
                    registroId: turmaReativada.id,
                    operacao: 'REACTIVATE',
                    descricao: `Turma ${turmaExiste.nomeCompleto} foi reativada por ${req.user.nome}`,
                    valorAnterior: {
                        ativo: false,
                        inativadoAt: turmaExiste.inativadoAt,
                    },
                    valorNovo: {
                        ativo: true,
                        inativadoAt: null,
                    },
                },
            });

            return turmaReativada;
        });

        return res.status(200).json({
            sucesso: true,
            mensagem: 'Turma reativada',
            dados: garantia,
        });
    } catch (error) {
        console.error('Erro ao reativar turma:', error);
        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao reativar turma',
            erro: error.message,
        });
    }
};

// Exclui turma permanentemente (apenas admin)
const excluiTurma = async (req, res) => {
    try {
        const { id } = req.params;

        // Controle de acesso
        switch (req.user.perfil) {
            case 'admin':
                break;
            default:
                return res.status(403).json({
                    sucesso: false,
                    mensagem: 'Apenas administradores podem excluir turmas',
                });
        }

        const turmaExiste = await prisma.turma.findUnique({
            where: { id },
            select: {
                id: true,
                nomeCompleto: true,
                anoSerieId: true,
                letra: true,
                anoLetivo: true,
                periodo: true,
                ativo: true,
            },
        });

        if (!turmaExiste) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Turma não encontrada',
            });
        }

        // Verifica se tem alunos vinculados
        const alunosVinculados = await prisma.aluno.count({
            where: {
                turmaId: id,
            },
        });
        if (alunosVinculados > 0) {
            return res.status(400).json({
                sucesso: false,
                mensagem: `Não é possível excluir esta turma. Ela possui ${alunosVinculados} aluno(s) vinculado(s).`,
                sugestao: 'Use a opção "Inativar" ao invés de excluir',
            });
        }

        // Verifica se tem planejamentos vinculados
        const planejamentosVinculados = await prisma.planejamento.count({
            where: {
                turmaId: id,
            },
        });
        if (planejamentosVinculados > 0) {
            return res.status(400).json({
                sucesso: false,
                mensagem: `Não é possível excluir esta turma. Ela possui ${planejamentosVinculados} planejamento(s) vinculado(s).`,
                sugestao: 'Use a opção "Inativar" ao invés de excluir',
            });
        }

        await prisma.$transaction(async (tx) => {
            await tx.auditLog.create({
                data: {
                    usuarioId: req.user.id,
                    usuarioNome: req.user.nome,
                    tabela: 'turmas',
                    registroId: turmaExiste.id,
                    operacao: 'DELETE',
                    descricao: `Turma ${turmaExiste.nomeCompleto} foi excluída permanentemente por ${req.user.nome}`,
                    valorAnterior: {
                        nomeCompleto: turmaExiste.nomeCompleto,
                        anoSerieId: turmaExiste.anoSerieId,
                        letra: turmaExiste.letra,
                        anoLetivo: turmaExiste.anoLetivo,
                        periodo: turmaExiste.periodo,
                        ativo: turmaExiste.ativo,
                    },
                    valorNovo: null,
                },
            });

            await tx.turma.delete({
                where: { id },
            });
        });

        return res.status(200).json({
            sucesso: true,
            mensagem: 'Turma excluída permanentemente',
        });
    } catch (error) {
        console.error('Erro ao excluir turma:', error);
        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao excluir turma',
            erro: error.message,
        });
    }
};

// Lista anos/séries disponíveis (para selects no frontend)
const listaAnoSerie = async (req, res) => {
    try {
        const anoSerie = await prisma.anoSerie.findMany({
            orderBy: { ordem: 'asc' },
        });

        return res.status(200).json({
            sucesso: true,
            mensagem: 'Anos/Séries listados',
            dados: anoSerie,
        });
    } catch (error) {
        console.error('Erro ao listar anos/séries:', error);
        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao listar anos/séries',
            erro: error.message,
        });
    }
};

module.exports = {
    listaTurmas,
    buscaTurmaId,
    criaTurma,
    editaTurma,
    inativaTurma,
    reativaTurma,
    excluiTurma,
    listaAnoSerie,
};
