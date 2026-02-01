const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const {
    validaCPF,
    validaDataNascimento,
    validaCPFDuplicado,
    validaTurma,
    geraMatricula
} = require('../utils/validacoes');

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
            offset = 0 // Pula uma certa quantidade de registros
        } = req.query;

        // Filtro
        const where = {};

        // Controle de acesso
        const { perfil, id: userId } = req.user;

        switch (perfil) {
            case 'admin': // Admin acessa todos os alunos
                if (turmaId) {
                    where.turmaId = turmaId;
                }
                break;

            case 'professor': // Professor acessa apenas alunos das turmas que ele está atribuído
                const turmasProfessor = await prisma.professorTurma.findMany({
                    where: { professorId: userId },
                    select: { turmaId: true }
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
                                offset: 0,
                                totalPaginas: 0
                            }
                        }
                    });
                }

                // Filtra apenas turmas que o professor tem acesso (se filtro é aplicado e professor não tem acesso, nega permissão)
                if (turmaId) {
                    if (!turmaIdsProfessor.includes(turmaId)) {
                        return res.status(403).json({
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
            where: { id },
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

        // Valida CPF
        const resultadoCPF = validaCPF(cpf);
        if (!resultadoCPF.valido) {
            return res.status(400).json({
                mensagem: resultadoCPF.mensagem
            });
        }
        const cpfNumero = resultadoCPF.cpfNumero;

        // Valida data de nascimento
        const resultadoDataNasc = validaDataNascimento(dataNascimento);
        if (!resultadoDataNasc.valido) {
            return res.status(400).json({
                mensagem: resultadoDataNasc.mensagem
            });
        }
        const dataNasc = resultadoDataNasc.dataNasc;

        // Verifica CPF duplicado
        const resultadoCPFDuplicado = await validaCPFDuplicado(cpfNumero);
        if (resultadoCPFDuplicado.existe) {
            return res.status(400).json({
                mensagem: resultadoCPFDuplicado.mensagem
            });
        }

        // Valida turma
        const resultadoTurma = await validaTurma(turmaId);
        if (!resultadoTurma.valido) {
            return res.status(400).json({
                mensagem: resultadoTurma.mensagem
            });
        }

        // Cria aluno no banco de dados
        const matricula = await geraMatricula();

        // Garante que em caso de erro, faça um rollback sem registrar o aluno nem o log
        const garantia = await prisma.$transaction(async (tx) => {
            const novoAluno = await tx.aluno.create({
                data: {
                    matricula,
                    nome,
                    email: email || null,
                    cpf: cpfNumero,
                    dataNascimento: dataNasc,
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

// Edita aluno
const editaAluno = async (req, res) => {
    try {
        const { id } = req.params;
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

        // 1. Validar campos obrigatórios
        if (!nome || !cpf || !dataNascimento || !telefone || !nomeResponsavel) {
            return res.status(400).json({
                mensagem: 'Campos obrigatórios: Nome, CPF, Data de Nascimento, Nome do Responsável e Telefone do Responsável'
            });
        }

        // Busca aluno atual
        const alunoAtual = await prisma.aluno.findUnique({
            where: { id },
            select: {
                id: true,
                matricula: true,
                nome: true,
                cpf: true,
                email: true,
                dataNascimento: true,
                telefone: true,
                nomeResponsavel: true,
                endereco: true,
                turmaId: true,
                ativo: true
            }
        });

        // Verifica se aluno existe
        if (!alunoAtual) {
            return res.status(404).json({
                mensagem: 'Aluno não encontrado'
            });
        }

        // Verifica se aluno está ativo
        if (!alunoAtual.ativo) {
            return res.status(400).json({
                mensagem: 'Não é possível editar um aluno inativo',
                sugestao: 'Reative o aluno antes de editá-lo'
            });
        }

        // Verifica se foram feitas mudanças nos campos 
        const camposMudados = {};
        const dadosParaAtualizar = {};

        const resultadoCPF = validaCPF(cpf);
        if (!resultadoCPF.valido) {
            return res.status(400).json({ mensagem: resultadoCPF.mensagem });
        }
        const cpfNumero = resultadoCPF.cpfNumero;

        if (cpfNumero !== alunoAtual.cpf) {
            const resultadoDuplicado = await validaCPFDuplicado(cpfNumero, id);
            if (resultadoDuplicado.existe) {
                return res.status(400).json({
                    mensagem: resultadoDuplicado.mensagem
                });
            }

            camposMudados.cpf = {
                anterior: alunoAtual.cpf,
                novo: cpfNumero
            };
            dadosParaAtualizar.cpf = cpfNumero;
        }

        const resultadoDataNasc = validaDataNascimento(dataNascimento);
        if (!resultadoDataNasc.valido) {
            return res.status(400).json({
                mensagem: resultadoDataNasc.mensagem
            });
        }
        const dataNasc = resultadoDataNasc.dataNasc;

        const dataAtualFormatada = alunoAtual.dataNascimento.toISOString().split('T')[0];
        const dataNovaFormatada = dataNasc.toISOString().split('T')[0];
        if (dataNovaFormatada !== dataAtualFormatada) {
            camposMudados.dataNascimento = {
                anterior: alunoAtual.dataNascimento,
                novo: dataNasc
            };
            dadosParaAtualizar.dataNascimento = dataNasc;
        }

        if (nome !== alunoAtual.nome) {
            camposMudados.nome = {
                anterior: alunoAtual.nome,
                novo: nome
            };
            dadosParaAtualizar.nome = nome;
        }

        const emailAtual = alunoAtual.email || null;
        const emailNovo = email || null;
        if (emailNovo !== emailAtual) {
            camposMudados.email = {
                anterior: emailAtual,
                novo: emailNovo
            };
            dadosParaAtualizar.email = emailNovo;
        }

        if (telefone !== alunoAtual.telefone) {
            camposMudados.telefone = {
                anterior: alunoAtual.telefone,
                novo: telefone
            };
            dadosParaAtualizar.telefone = telefone;
        }

        if (nomeResponsavel !== alunoAtual.nomeResponsavel) {
            camposMudados.nomeResponsavel = {
                anterior: alunoAtual.nomeResponsavel,
                novo: nomeResponsavel
            };
            dadosParaAtualizar.nomeResponsavel = nomeResponsavel;
        }

        const enderecoAtual = alunoAtual.endereco || null;
        const enderecoNovo = endereco || null;
        if (enderecoNovo !== enderecoAtual) {
            camposMudados.endereco = {
                anterior: enderecoAtual,
                novo: enderecoNovo
            };
            dadosParaAtualizar.endereco = enderecoNovo;
        }

        const turmaAtual = alunoAtual.turmaId || null;
        const turmaNova = turmaId || null;
        if (turmaNova !== turmaAtual) {
            const resultadoTurma = await validaTurma(turmaNova);
            if (!resultadoTurma.valido) {
                return res.status(400).json({
                    mensagem: resultadoTurma.mensagem
                });
            }
            camposMudados.turmaId = {
                anterior: turmaAtual,
                novo: turmaNova
            };
            dadosParaAtualizar.turmaId = turmaNova;
        }

        // Se nada mudou, não faz update
        if (Object.keys(camposMudados).length === 0) {
            return res.status(200).json({
                mensagem: 'Nenhuma alteração foi realizada',
                aluno: alunoAtual
            });
        }

        // Cria valorAnterior e valorNovo (apenas dos campos que mudaram)
        const valorAnterior = {};
        const valorNovo = {};
        for (const campo in camposMudados) {
            valorAnterior[campo] = camposMudados[campo].anterior;
            valorNovo[campo] = camposMudados[campo].novo;
        }

        // Garante que em caso de erro, faça um rollback sem editar o aluno nem registrar o log
        dadosParaAtualizar.updatedAt = new Date();
        const garantia = await prisma.$transaction(async (tx) => {
            const alunoAtualizado = await tx.aluno.update({
                where: { id },
                data: dadosParaAtualizar
            });

            // Registra log apenas com os campos que mudaram
            await tx.auditLog.create({
                data: {
                    usuarioId: req.user.id,
                    usuarioNome: req.user.nome,
                    tabela: 'alunos',
                    registroId: alunoAtualizado.id,
                    operacao: 'UPDATE',
                    descricao: `Aluno [${alunoAtual.matricula}] ${alunoAtual.nome} teve ${Object.keys(camposMudados).length} campo(s) editado(s) por ${req.user.nome}: ${Object.keys(camposMudados).join(', ')}`,
                    valorAnterior,
                    valorNovo
                }
            });

            return alunoAtualizado;
        });

        return res.status(200).json({
            mensagem: `Aluno atualizado. ${Object.keys(camposMudados).length} campo(s) alterado(s).`,
            camposAlterados: Object.keys(camposMudados),
            aluno: garantia
        });

    } catch (error) {
        console.error('Erro ao editar aluno:', error);
        return res.status(500).json({
            mensagem: 'Erro ao editar aluno',
            erro: error.message
        });
    }
};

// Inativa Aluno
const inativaAluno = async (req, res) => {
    try {
        const { id } = req.params;

        // Valida se aluno existe
        const alunoExiste = await prisma.aluno.findUnique({
            where: { id },
            select: {
                id: true,
                matricula: true,
                nome: true,
                ativo: true
            }
        });

        if (!alunoExiste) {
            return res.status(404).json({
                mensagem: 'Aluno não encontrado'
            });
        }

        // Verifica se aluno já está inativo
        if (!alunoExiste.ativo) {
            return res.status(400).json({
                mensagem: 'Aluno já está inativo'
            });
        }

        // Garante que em caso de erro, faça um rollback sem inativar o aluno nem gerar o log
        const garantia = await prisma.$transaction(async (tx) => {
            const alunoInativado = await tx.aluno.update({
                where: { id },
                data: {
                    ativo: false,
                    inativadoAt: new Date()
                }
            });

            // Registra log de inativação de aluno
            await tx.auditLog.create({
                data: {
                    usuarioId: req.user.id,
                    usuarioNome: req.user.nome,
                    tabela: 'alunos',
                    registroId: alunoInativado.id,
                    operacao: 'INACTIVATE',
                    descricao: `Aluno [${alunoExiste.matricula}] ${alunoExiste.nome} foi inativado por ${req.user.nome}`,
                    valorAnterior: {
                        ativo: true,
                        inativadoAt: null
                    },
                    valorNovo: {
                        ativo: false,
                        inativadoAt: alunoInativado.inativadoAt
                    }
                }
            });

            return alunoInativado;
        });

        return res.status(200).json({
            mensagem: 'Aluno inativado',
            aluno: garantia
        });

    } catch (error) {
        console.error('Erro ao inativar aluno:', error);
        return res.status(500).json({
            mensagem: 'Erro ao inativar aluno',
            erro: error.message
        });
    }
};

// Reativa Aluno
const reativaAluno = async (req, res) => {
    try {
        const { id } = req.params;

        // Valida se aluno existe
        const alunoExiste = await prisma.aluno.findUnique({
            where: { id },
            select: {
                id: true,
                matricula: true,
                nome: true,
                ativo: true,
                inativadoAt: true
            }
        });

        if (!alunoExiste) {
            return res.status(404).json({
                mensagem: 'Aluno não encontrado'
            });
        }

        // Verifica se aluno já está ativo
        if (alunoExiste.ativo) {
            return res.status(400).json({
                mensagem: 'Aluno já está ativo'
            });
        }

        // Garante que em caso de erro, faça um rollback sem reativar o aluno nem gerar o log
        const garantia = await prisma.$transaction(async (tx) => {
            const alunoReativado = await tx.aluno.update({
                where: { id },
                data: {
                    ativo: true,
                    inativadoAt: null
                }
            });

            // Registra log de reativação de aluno
            await tx.auditLog.create({
                data: {
                    usuarioId: req.user.id,
                    usuarioNome: req.user.nome,
                    tabela: 'alunos',
                    registroId: alunoReativado.id,
                    operacao: 'REACTIVATE',
                    descricao: `Aluno [${alunoExiste.matricula}] ${alunoExiste.nome} foi reativado por ${req.user.nome}`,
                    valorAnterior: {
                        ativo: false,
                        inativadoAt: alunoExiste.inativadoAt
                    },
                    valorNovo: {
                        ativo: true,
                        inativadoAt: null
                    }
                }
            });

            return alunoReativado;
        });

        return res.status(200).json({
            mensagem: 'Aluno reativado',
            aluno: garantia
        });

    } catch (error) {
        console.error('Erro ao reativar aluno:', error);
        return res.status(500).json({
            mensagem: 'Erro ao reativar aluno',
            erro: error.message
        });
    }
};

// Exclui aluno permanentemente
const excluiAluno = async (req, res) => {
    try {
        const { id } = req.params;

        // Valida se aluno existe
        const alunoExiste = await prisma.aluno.findUnique({
            where: { id },
            select: {
                id: true,
                matricula: true,
                nome: true,
                cpf: true,
                email: true,
                dataNascimento: true,
                telefone: true,
                nomeResponsavel: true,
                endereco: true,
                turmaId: true,
                ativo: true
            }
        });

        if (!alunoExiste) {
            return res.status(404).json({
                mensagem: 'Aluno não encontrado'
            });
        }

        // Verifica se tem notas vinculadas
        const notasVinculadas = await prisma.nota.count({
            where: { alunoId: id }
        });

        if (notasVinculadas > 0) {
            return res.status(400).json({
                mensagem: `Não é possível excluir este aluno. Ele possui ${notasVinculadas} nota(s) vinculada(s).`,
                sugestao: 'Use a opção "Inativar" ao invés de excluir'
            });
        }

        // Registra log antes de deletar o aluno
        await prisma.$transaction(async (tx) => {
            await tx.auditLog.create({
                data: {
                    usuarioId: req.user.id,
                    usuarioNome: req.user.nome,
                    tabela: 'alunos',
                    registroId: alunoExiste.id,
                    operacao: 'DELETE',
                    descricao: `Aluno [${alunoExiste.matricula}] ${alunoExiste.nome} foi excluído permanentemente por ${req.user.nome}`,
                    valorAnterior: {
                        matricula: alunoExiste.matricula,
                        nome: alunoExiste.nome,
                        cpf: alunoExiste.cpf,
                        email: alunoExiste.email,
                        dataNascimento: alunoExiste.dataNascimento,
                        telefone: alunoExiste.telefone,
                        nomeResponsavel: alunoExiste.nomeResponsavel,
                        endereco: alunoExiste.endereco,
                        turmaId: alunoExiste.turmaId,
                        ativo: alunoExiste.ativo
                    },
                    valorNovo: null
                }
            });

            // Deleta aluno
            await tx.aluno.delete({
                where: { id }
            });
        });

        return res.status(200).json({
            mensagem: 'Aluno excluído permanentemente'
        });

    } catch (error) {
        console.error('Erro ao excluir aluno:', error);
        return res.status(500).json({
            mensagem: 'Erro ao excluir aluno',
            erro: error.message
        });
    }
};

module.exports = {
    listaAlunos,
    buscaAlunoId,
    criaAluno,
    editaAluno,
    inativaAluno,
    reativaAluno,
    excluiAluno
};