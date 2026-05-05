const prisma = require('./prisma');
// const { cpf: cpfValidator } = require('cpf-cnpj-validator');

/**
 * Valida e formata CPF
 * @param {string} cpf - CPF a ser validado
 * @returns {Object} { valido: boolean, cpfNumero: string, mensagem: string }
 */
function validaCPF(cpf) {
    // Valida se CPF é válido (Não utilizar no MVP)
    /*if (!cpfValidator.isValid(cpf)) {
        return res.status(400).json({
            mensagem: 'CPF Inválido'
        });
    }*/

    // Remove pontuação do CPF
    const cpfNumero = cpf.replace(/\D/g, '');

    // Verifica se CPF possui 11 dígitos (Utilizar apenas no MVP)
    if (cpfNumero.length !== 11) {
        return {
            valido: false,
            cpfNumero: null,
            mensagem: 'CPF deve conter 11 dígitos',
        };
    }

    return {
        valido: true,
        cpfNumero,
        mensagem: null,
    };
}

/**
 * Valida data de nascimento
 * @param {string} dataNascimento - Data a ser validada
 * @returns {Object} { valido: boolean, dataNasc: Date, mensagem: string }
 */
function validaDataNascimento(dataNascimento) {
    const hoje = new Date();
    const dataNasc = new Date(dataNascimento);

    // Verifica se a data é válida
    if (isNaN(dataNasc.getTime())) {
        return {
            valido: false,
            dataNasc: null,
            mensagem: 'Data de nascimento inválida',
        };
    }

    // Verifica se a data não é futura
    if (dataNasc > hoje) {
        return {
            valido: false,
            dataNasc: null,
            mensagem: 'Data de nascimento não pode ser futura',
        };
    }

    return {
        valido: true,
        dataNasc,
        mensagem: null,
    };
}

/**
 * Verifica se CPF já existe
 * @param {string} cpfNumero - CPF já formatado (apenas números)
 * @param {string} idExcluir - Excluir ID do aluno na verificação
 * @returns {Object} { existe: boolean, mensagem: string }
 */
async function validaCPFDuplicado(cpfNumero, idExcluir = null) {
    const where = { cpf: cpfNumero };

    if (idExcluir) {
        where.id = { not: idExcluir };
    }

    const cpfExiste = await prisma.aluno.findFirst({ where });

    if (cpfExiste) {
        return {
            existe: true,
            mensagem: 'Este CPF já está cadastrado',
        };
    }

    return {
        existe: false,
        mensagem: null,
    };
}

/**
 * Verifica se turma existe e está ativa
 * @param {string} turmaId - ID da turma
 * @returns {Object} { valido: boolean, turma: Object, mensagem: string }
 */
async function validaTurma(turmaId) {
    if (!turmaId) {
        return {
            valido: true,
            turma: null,
            mensagem: null,
        };
    }

    const turma = await prisma.turma.findUnique({
        where: { id: turmaId },
        select: { id: true, ativo: true },
    });

    if (!turma) {
        return {
            valido: false,
            turma: null,
            mensagem: 'Turma não encontrada',
        };
    }

    if (!turma.ativo) {
        return {
            valido: false,
            turma,
            mensagem: 'Não é possível vincular aluno a uma turma inativa',
        };
    }

    return {
        valido: true,
        turma,
        mensagem: null,
    };
}

/**
 * Valida telefone
 * @param {string} telefone - Telefone a ser validado
 * @returns {Object} { valido: boolean, telefoneNumero: string, mensagem: string }
 */
function validaTelefone(telefone) {
    if (!telefone) {
        return {
            valido: false,
            telefoneNumero: null,
            mensagem: 'Telefone é obrigatório',
        };
    }

    const telefoneNumero = telefone.replace(/\D/g, ''); // Remove pontuação

    // Verifica se telefone possui 10 ou 11 dígitos
    if (telefoneNumero.length !== 10 && telefoneNumero.length !== 11) {
        return {
            valido: false,
            telefoneNumero: null,
            mensagem: 'Telefone deve conter 10 ou 11 dígitos',
        };
    }

    return {
        valido: true,
        telefoneNumero,
        mensagem: null,
    };
}

/**
 * Gera matrícula automática
 * @returns {string}
 */
async function geraMatricula() {
    const anoAtual = new Date().getFullYear();

    // Busca se já existe alguma matrícula no ano vigente
    const ultimaMatricula = await prisma.aluno.findFirst({
        where: {
            matricula: {
                startsWith: anoAtual.toString(),
            },
        },
        orderBy: { createdAt: 'desc' },
        select: { matricula: true },
    });

    let novaMatricula = 1;

    // Caso exista matrícula, adiciona 1 número, senão começa a sequência a partir do 001
    if (ultimaMatricula && ultimaMatricula.matricula) {
        const sequencia = ultimaMatricula.matricula.slice(-3);
        novaMatricula = parseInt(sequencia) + 1;
    }
    // Formata número para o formato "Ano + 000"
    novaMatricula = novaMatricula.toString().padStart(3, '0');
    return `${anoAtual}${novaMatricula}`;
}

/**
 * Valida ano letivo
 * @param {string|number} anoLetivo - Ano letivo a ser validado
 * @returns {Object} { valido: boolean, anoLetivoNum: number, mensagem: string }
 */
function validaAnoLetivo(anoLetivo) {
    const anoLetivoNum = parseInt(anoLetivo);

    if (isNaN(anoLetivoNum)) {
        return {
            valido: false,
            anoLetivoNum: null,
            mensagem: 'Ano letivo inválido',
        };
    }

    return {
        valido: true,
        anoLetivoNum,
        mensagem: null,
    };
}

/**
 * Valida e formata letra da turma
 * @param {string} letra - Letra a ser validada
 * @returns {Object} { valido: boolean, letraMaiuscula: string, mensagem: string }
 */
function validaLetraTurma(letra) {
    if (!letra) {
        return {
            valido: true,
            letraMaiuscula: null,
            mensagem: null,
        };
    }

    const letraMaiuscula = letra.toUpperCase();

    if (!letraMaiuscula || !/^[A-Z]$/.test(letraMaiuscula)) {
        return {
            valido: false,
            letraMaiuscula: null,
            mensagem: 'Escolha uma letra entre A e Z',
        };
    }

    return {
        valido: true,
        letraMaiuscula,
        mensagem: null,
    };
}

/**
 * Valida período da turma
 * @param {string} periodo - Período a ser validado
 * @returns {Object} { valido: boolean, mensagem: string }
 */
function validaPeriodo(periodo) {
    const periodosValidos = ['MATUTINO', 'VESPERTINO', 'NOTURNO'];

    if (!periodosValidos.includes(periodo)) {
        return {
            valido: false,
            mensagem: 'Período inválido. Escolha entre MATUTINO, VESPERTINO ou NOTURNO',
        };
    }

    return {
        valido: true,
        mensagem: null,
    };
}

module.exports = {
    validaCPF,
    validaDataNascimento,
    validaCPFDuplicado,
    validaTurma,
    validaTelefone,
    geraMatricula,
    validaAnoLetivo,
    validaLetraTurma,
    validaPeriodo,
};
