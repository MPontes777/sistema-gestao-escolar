const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { cpf: cpfValidator } = require('cpf-cnpj-validator');

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
                if (turmaId) {
                    where.turmaId = turmaId;
                }
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
                
                // Filtra apenas turmas que o professor tem acesso (se filtro é aplicado e professor não tem acesso, nega permissão) 
                if (turmaId) {
                    if (!turmaIdsProfessor.includes(turmaId)) {
                        return res.status(403).json ({
                            sucesso: false,
                            mensagem: 'Você não tem permissão para visualizar essa turma'
                        });
                    }
                    where.turmaId = turmaId;
                } else {
                    where.turmaId = { in: turmaIdsProfessor };
                }
            break;

            default: // Outro perfil
                return res.status(403).json({
                    sucesso: false,
                    mensagem: 'Você não tem permissão para visualizar essa turma'
                });
        }

        // Filtro por status
        if (status === 'ativo') {
            where.inativadoAt = null;
        } else if (status === 'inativo') {
            where.inativadoAt = { not: null };
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

// Gera Matrícula
async function geraMatricula() {
    const anoAtual = new Date().getFullYear();

    // Busca se já existe alguma matrícula no ano vigente
    const ultimaMatricula = await prisma.aluno.findFirst({
        where: {
            matricula: {
                startsWith: anoAtual.toString()
            }
        },
        orderBy: { createdAt: 'desc' },
        select: { matricula: true }
    });

    let novaMatricula = 1;

    // Caso exista matrícula, adiciona 1 número, senão começa a sequência a partir do 1 
    if(ultimaMatricula && ultimaMatricula.matricula) {
        const sequencia = ultimaMatricula.matricula.slice(-3);
        novaMatricula = parseInt(sequencia) + 1
    }
    // Formata número para o formato "Ano + 000"
    novaMatricula = novaMatricula.toString().padStart(3, '0');
    return `${anoAtual}${novaMatricula}`;
};

// Registra na tabela de logs
async function criaLog(usuarioId, usuarioNome, tabela, registroId, operacao, descricao, valorAnterior = null, valorNovo = null) {
    try {
        await prisma.auditLog.create({
            data: {
                usuarioId,
                usuarioNome,
                tabela,
                registroId,
                operacao,
                descricao,
                valorAnterior,
                valorNovo
            }
        });
        console.log(`Log ${operacao} registrado em ${tabela}`);
    } catch (error) {
        console.log('Erro ao registrar log', error);
    }
};

// Cria novo aluno
const criaAluno = async (req, res) => {
    try {
        // Extrai dados do body
        const {
            nome,
            email,
            cpf,
            dataNascimento,
            telefone,
            nomeResponsavel,
            endereco,
            turmaId
        } = req.body;

        // Valida campos obrigatórios
        if (!nome || !cpf || !dataNascimento || !telefone || !nomeResponsavel) {
            return res.status(400).json({
                mensagem: 'Campos obrigatórios: Nome, CPF, Data de Nascimento, Nome do Responsável e Telefone do Responsável'
            });
        }

        // Valida CPF (Não utilizar no MVP)
        /*if (!cpfValidator.isValid(cpf)) {
            return res.status(400).json({
                mensagem: 'CPF Inválido'
            });
        }*/

        // Remove pontuação do CPF
        const cpfNumero = cpf.replace(/\D/g, '');

        // Valida se CPF possui 11 dígitos (Utilizar apenas no MVP)
        if (cpfNumero.length !== 11) {
            return res.status(400).json({
                mensagem: 'CPF deve conter 11 dígitos'
            });
        }

        // Valida data de nascimento
        const hoje = new Date();
        const dataNasc = new Date(dataNascimento);

        // Verifica se a data é válida
        if (isNaN(dataNasc.getTime())) {
            return res.status(400).json({
                mensagem: 'Data de nascimento inválida'
            });
        }

        // Verifica se a data não é futura
        if (dataNasc > hoje) {
            return res.status(400).json({
                mensagem: 'Data de nascimento não pode ser uma data futura'
            });
        }

        // Verifica se CPF já existe
        const cpfExiste = await prisma.aluno.findUnique({
            where: {
                cpf: cpfNumero
            }
        });

        if (cpfExiste) {
            return res.status(400).json({
                mensagem: 'Este CPF já está cadastrado'
            });
        }

        // Valida se turma existe e está ativa (caso aluno esteja vinculado)
        if (turmaId) {
            const turmaExiste = await prisma.turma.findUnique({
                where: { id: turmaId }
            });

            if (!turmaExiste) {
                return res.status(400).json({
                    mensagem: 'Turma não encontrada'
                });
            }

            if (!turmaExiste.ativo) {
                return res.status(400).json({
                    mensagem: 'Não é possível matricular alunos em uma turma inativa'
                });
            }
        }

        // Cria aluno no banco de dados
        const matricula = await geraMatricula();
        
        // Garante que em caso de erro, gere um rollback e não registre nem o aluno nem o log
        const garantia = await prisma.$transaction(async (tx) => {
            const novoAluno = await tx.aluno.create({
                data: {
                    matricula,
                    nome,
                    email: email || null,
                    cpf: cpfNumero,
                    dataNascimento: new Date(dataNascimento),
                    telefone,
                    nomeResponsavel,
                    endereco: endereco || null,
                    turmaId: turmaId || null,
                    ativo: true
                },
                include: {
                    turma: {
                        select: {
                            id: true,
                            nomeCompleto: true
                        }
                    }
                }
            });

            // Registra log de criação de aluno
            await tx.auditLog.create({
                data: {
                    usuarioId: req.user.id,
                    usuarioNome: req.user.nome,
                    tabela: 'alunos',
                    registroId: novoAluno.id,
                    operacao: 'CREATE',
                    descricao: `Aluno [${novoAluno.matricula}] ${novoAluno.nome} foi criado por ${req.user.nome}`, // Descrição
                    valorAnterior: null,
                    valorNovo: {
                        matricula: novoAluno.matricula,
                        nome: novoAluno.nome,
                        cpf: novoAluno.cpf,
                        email: novoAluno.email,
                        dataNascimento: novoAluno.dataNascimento,
                        telefone: novoAluno.telefone,
                        nomeResponsavel: novoAluno.nomeResponsavel,
                        endereco: novoAluno.endereco,
                        turmaId: novoAluno.turmaId
                    }
                }
            });

            return novoAluno;
        });

        return res.status(201).json({
            mensagem: 'Aluno criado',
            aluno: garantia
        });

    } catch (error) {
        console.error('Erro ao criar aluno:', error);
        return res.status(500).json({
            mensagem: 'Erro ao criar aluno',
            erro: error.message
        });
    }
};

module.exports = {
    listaAlunos,
    buscaAlunoId,
    criaAluno
};