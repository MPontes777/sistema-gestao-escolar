const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Lista todos os alunos
const listaAlunos = async (req, res) => {
    try {
        const {
            status,
            turmaId,
            nome,
            ordenarPor = 'nome', // Ordenação
            ordem = 'asc',
            limit = 10, // Quantidade por página
            offset = 0 // Página
        } = req.query;

        // Filtro
        const where = {};

        // Controle de Acesso
        const { perfil, id: userId } = req.user;

        switch (perfil) {
            case 'admin': // Admin acessa todos os alunos
            break;

            case 'professor': // Professor acessa apenas alunos das turmas que ele está atribuído
                const turmasProfessor = await prisma.professorTurma.findMany({
                    where: {
                        professorId: userId
                    },
                    select: {
                        turmaId: true
                    }
                });

                // Verifica se professor está atribuído em alguma turma
                const turmaIdsProfessor = turmasProfessor.map(pt => pt.turmaId);

                if (turmaIdsProfessor.length === 0) {
                    return res.status(200).json({
                        sucesso: true,
                        mensagem: 'Nenhum aluno encontrado',
                        dados: {
                            alunos: [],
                            paginacao: {
                                total: 0,
                                // limit: 10,
                                offset: 0,
                                totalPaginas: 0
                            }
                        }
                    });
                }
                where.turmaId = { in: turmaIdsProfessor };
            break;

            default: // Outro perfil
                return res.status(403).json({
                    sucesso: false,
                    mensagem: 'Não autorizado'
                });
        }

        // Filtro por status
        if (status === 'ativo') {
            where.inativadoAt = null;
        } else if (status === 'inativo') {
            where.inativadoAt = { not: null };
        }

        // Filtro por turma
        if (turmaId) {
            where.turmaId = turmaId;
        }

        // Filtro por nome
        if (nome) {
            where.nome = {
                contains: nome, // Apenas uma parte do nome
                mode: 'insensitive' // Independente se está em maiúsculo ou minúsculo
            };
        }

        // Ordenação
        const orderBy = {};
        orderBy[ordenarPor] = ordem;

        // Consulta alunos filtrados
        const alunos = await prisma.aluno.findMany({
            where,
            orderBy,
            take: parseInt(limit),
            skip: parseInt(offset),
            include: {
                turma: {
                    select: {
                        id: true,
                        nomeCompleto: true,
                        periodo: true
                    }
                }
            }
        });

        // Conta total de alunos para paginação
        const total = await prisma.aluno.count({ where });

        res.status(200).json({
            sucesso: true,
            mensagem: 'Alunos listados',
            dados: {
                alunos,
                paginacao: {
                    total,
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    totalPaginas: Math.ceil(total / parseInt(limit))
                }
            }
        });

    } catch (error) {
        console.error('Erro ao listar alunos:', error);
        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao listar alunos',
            erro: error.message
        });
    }
};

// Busca aluno por ID
const buscaAlunoId = async (req, res) => {
    try {
        const { id } = req.params;

        const aluno = await prisma.aluno.findUnique({
            where: { id: id },
            include: {
                turma: {
                    select: {
                        id: true,
                        nomeCompleto: true,
                        periodo: true
                    }
                },
                notas: {
                    select: {
                        id: true,
                        bimestre1: true,
                        bimestre2: true,
                        bimestre3: true,
                        bimestre4: true,
                        mediaFinal: true,
                        criterio: true,
                        disciplina: {
                            select: {
                                id: true,
                                nome: true
                            }
                        }
                    }
                }
            }
        });

        if (!aluno) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Aluno não encontrado'
            });
        }

        // Controle de Acesso
        const { perfil, id: userId } = req.user;

        switch (perfil) {
            case 'admin': // Admin acessa todos os alunos
            break;

            case 'professor': // Professor acessa apenas alunos das turmas que ele está atribuído
                const alunoProfessor = await prisma.professorTurma.findFirst({
                    where: {
                        professorId: userId,
                        turmaId: aluno.turmaId
                    }
                });

                if (!alunoProfessor) {
                    return res.status(403).json({
                        sucesso: false,
                        mensagem: 'Você não tem permissão para visualizar este aluno'
                    });
                }

                // Professor acessa apenas notas das disciplinas que ele está atribuído
                const disciplinasProfessor = await prisma.professorTurma.findMany({
                    where: {
                        professorId: userId,
                        turmaId: aluno.turmaId
                    },
                    select: { disciplinaId: true }
                });

                const disciplinaIdsProfessor = disciplinasProfessor.map(pd => pd.disciplinaId);
                aluno.notas = aluno.notas.filter(nota => disciplinaIdsProfessor.includes(nota.disciplina.id));
            break;

            default:
                return res.status(403).json({
                    sucesso: false,
                    mensagem: 'Você não tem permissão para visualizar este aluno'
                });
        }

        res.status(200).json({
            sucesso: true,
            mensagem: 'Aluno encontrado',
            dados: aluno
        });

    } catch (error) {
        console.error('Erro ao buscar aluno:', error);
        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao buscar aluno',
            erro: error.message
        });
    }
};

module.exports = {
    listaAlunos,
    buscaAlunoId
};