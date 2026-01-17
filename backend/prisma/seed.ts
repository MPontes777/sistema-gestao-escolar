import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('Iniciando seed\n');

    // Limpa dados existentes
    console.log('Limpando dados existentes');
    await prisma.auditLog.deleteMany();
    await prisma.nota.deleteMany();
    await prisma.planejamento.deleteMany();
    await prisma.professorTurma.deleteMany();
    await prisma.aluno.deleteMany();
    await prisma.turma.deleteMany();
    await prisma.disciplina.deleteMany();
    await prisma.usuario.deleteMany();
    console.log('Dados limpos com sucesso\n');

    //Popula tabela de disciplina
    console.log('Populando tabela de disciplinas');

    const matematica = await prisma.disciplina.create({
        data: {
            nome: 'Matemática',
            ativo: true,
        },
    });
    const portugues = await prisma.disciplina.create({
        data: {
            nome: 'Português',
            ativo: true,
        },
    });
    const historia = await prisma.disciplina.create({
        data: {
            nome: 'História',
            ativo: true,
        },
    });
    const geografia = await prisma.disciplina.create({
        data: {
            nome: 'Geografia',
            ativo: true,
        },
    });
    const ciencias = await prisma.disciplina.create({
        data: {
        nome: 'Ciências',
        ativo: true,
        },
    });
    const ingles = await prisma.disciplina.create({
        data: {
        nome: 'Inglês',
        ativo: true,
        },
    });

    console.log('Tabela de disciplinas populada com sucesso\n');

    //Popula tabela de disciplinas
    console.log('Populando tabela de usuarios');

    // Senha única e criptografada para todos os usuários no MVP
    const senhaHash = await bcrypt.hash('senha123', 10);

    //Cria Admin
    const admin = await prisma.usuario.create({
        data: {
            nome: 'Administrador',
            email: 'admin@escola.com',
            senha: senhaHash,
            perfil: 'admin',
            ativo: true,
        },
    });
    console.log('Administrador criado');

    //Cria Professores
    const profMatematica = await prisma.usuario.create({
        data: {
            nome: 'Mateus Pontes',
            email: 'mateus.pontes@escola.com',
            senha: senhaHash,
            perfil: 'professor',
            ativo: true,
        },
    });
    console.log('Professor de matemática criado');
    const profPortugues = await prisma.usuario.create({
        data: {
            nome: 'Ellen Melo',
            email: 'ellen.melo@escola.com',
            senha: senhaHash,
            perfil: 'professor',
            ativo: true,
        },
    });
    console.log('Professor de portugues criado');
    const profCiencias = await prisma.usuario.create({
        data: {
            nome: 'Fagner Januario',
            email: 'fagner.januario@escola.com',
            senha: senhaHash,   
            perfil: 'professor',
            ativo: true,
        },
    });
    console.log('Professor de ciencias criado');
    //Testa usuario inativo
    const profInativo = await prisma.usuario.create({
        data: {
            nome: 'Pedro Coelho',
            email: 'pedro.coelho@escola.com',
            senha: senhaHash,
            perfil: 'professor',
            ativo: false,
            inativadoAt: new Date('2025-12-16'),
        },
    });
    console.log('Professor inativo criado');
    console.log('Tabela de usuarios populada com sucesso\n');

    //Popula tabela de turmas
    console.log('Populando tabela de turmas');

    const turma8A2025 = await prisma.turma.create({
        data: {
            anoSerie: '8º',
            letra: 'A',
            periodo: 'MATUTINO',
            anoLetivo: 2025,
            nomeCompleto: '8º A (2025)',
            ativo: true,
        },
    });
    console.log('8º A (2025) criada');
    const turma8B2025 = await prisma.turma.create({
        data: {
            anoSerie: '8º',
            letra: 'B',
            periodo: 'VESPERTINO',
            anoLetivo: 2025,
            nomeCompleto: '8º B (2025)',
            ativo: true,
        },
    });
    console.log('8º B (2025) criada');
    const turma9A2025 = await prisma.turma.create({
        data: {
            anoSerie: '9º',
            letra: 'A',
            periodo: 'MATUTINO',
            anoLetivo: 2025,
            nomeCompleto: '9º A (2025)',
            ativo: true,
        },
    });
    console.log('9º A (2025) criada');
    const turma9A2024 = await prisma.turma.create({
        data: {
            anoSerie: '9º',
            letra: 'A',
            periodo: 'MATUTINO',
            anoLetivo: 2024,
            nomeCompleto: '9º A (2024)',
            ativo: false,
            inativadoAt: new Date('2024-12-20'),
        },
    });
    console.log('9º A (2024) criada');
    console.log('Tabela de turmas populada com sucesso!\n');

    //Vincula professores às turmas e disciplinas
    console.log('Vinculando professores às turmas e disciplinas');

    await prisma.professorTurma.create({
        data: {
            professorId: profMatematica.id,
            turmaId: turma8A2025.id,
            disciplinaId: matematica.id,
        },
    });
    console.log('Professor de matematica vinculado a 8º A (2025)');
    await prisma.professorTurma.create({
        data: {
            professorId: profMatematica.id,
            turmaId: turma9A2025.id,
            disciplinaId: matematica.id,
        },
    });
    console.log('Professor de matematica vinculado a 9º A (2025)');
        await prisma.professorTurma.create({
        data: {
            professorId: profPortugues.id,
            turmaId: turma8A2025.id,
            disciplinaId: portugues.id,
        },
    });
    console.log('Professor de portugues vinculado a 8º A (2025)');
        await prisma.professorTurma.create({
        data: {
            professorId: profPortugues.id,
            turmaId: turma8B2025.id,
            disciplinaId: portugues.id,
        },
    });
    console.log('Professor de portugues vinculado a 8º B (2025)');
        await prisma.professorTurma.create({
        data: {
            professorId: profPortugues.id,
            turmaId: turma9A2025.id,
            disciplinaId: portugues.id,
        },
    });
    console.log('Professor de portugues vinculado a 9º A (2025)');
        await prisma.professorTurma.create({
        data: {
            professorId: profCiencias.id,
            turmaId: turma9A2025.id,
            disciplinaId: ciencias.id,
        },
    });
    console.log('Professor de ciencias vinculado a 9º A (2025)');
        await prisma.professorTurma.create({
        data: {
            professorId: profInativo.id,
            turmaId: turma9A2024.id,
            disciplinaId: portugues.id,
        },
    });
    console.log('Professor inativo vinculado a 9º A (2024)');
    console.log('Vinculos criados com sucesso\n');

    //Popula tabela de alunos
    console.log('Populando tabela de alunos');

    // Alunos da Turma 8º A (2025)
    const aluno1 = await prisma.aluno.create({
        data: {
            matricula: '2025001',
            nome: 'Ana Paula Silva',
            cpf: '11111111111',
            dataNascimento: new Date('2011-03-15'),
            email: 'ana.silva@email.com',
            telefone: '(11) 98765-4321',
            nomeResponsavel: 'Carlos Silva',
            endereco: 'Rua Cumbe, 80 - São Paulo/SP',
            turmaId: turma8A2025.id,
            ativo: true,
        },
    });
    console.log('Aluno criado');
    const aluno2 = await prisma.aluno.create({
        data: {
            matricula: '2025002',
            nome: 'Bruno Costa',
            cpf: '22222222222',
            dataNascimento: new Date('2011-07-22'),
            email: 'bruno.costa@email.com',
            telefone: '(11) 98765-4321',
            nomeResponsavel: 'Maria Costa',
            endereco: 'Av. do Estado, 132 - São Paulo/SP',
            turmaId: turma8A2025.id,
            ativo: false,
            inativadoAt: new Date('2025-08-26'),
        },
    });
    console.log('Aluno criado');
    const aluno3 = await prisma.aluno.create({
        data: {
            matricula: '2025003',
            nome: 'Carla Mendes',
            cpf: '33333333333',
            dataNascimento: new Date('2011-11-08'),
            email: 'carla.mendes@email.com',
            telefone: '(11) 98765-4323',
            nomeResponsavel: 'José Mendes',
            endereco: 'Rua Vicente Amaral, 1209 - São Paulo/SP',
            turmaId: turma8A2025.id,
            ativo: true,
        },
    });
    console.log('Aluno criado');

    // Alunos da Turma 8º B (2025)
    const aluno4 = await prisma.aluno.create({
        data: {
            matricula: '2025004',
            nome: 'Daniel Souza',
            cpf: '44444444444',
            dataNascimento: new Date('2011-01-30'),
            email: 'daniel.souza@email.com',
            telefone: '(11) 98765-4324',
            nomeResponsavel: 'Ana Luiza Souza',
            endereco: 'Rua Germano Limeira, 128 - São Paulo/SP',
            turmaId: turma8B2025.id,
            ativo: true,
        },
    });
    console.log('Aluno criado');
    const aluno5 = await prisma.aluno.create({
        data: {
            matricula: '2025005',
            nome: 'Eduarda Lima',
            cpf: '55555555555',
            dataNascimento: new Date('2011-05-18'),
            email: 'eduarda.lima@email.com',
            telefone: '(11) 98765-4325',
            nomeResponsavel: 'Roberto Lima',
            endereco: 'Av. Central, 452 - São Paulo/SP',
            turmaId: turma8B2025.id,
            ativo: true,
        },
    });
    console.log('Aluno criado');

    // Alunos da Turma 9º A (2025)
    const aluno6 = await prisma.aluno.create({
        data: {
            matricula: '2025006',
            nome: 'Fernando Rocha',
            cpf: '66666666666',
            dataNascimento: new Date('2010-09-25'),
            email: 'fernando.rocha@email.com',
            telefone: '(11) 98765-4326',
            nomeResponsavel: 'Patrícia Rocha',
            endereco: 'Rua Japão, 514 - São Paulo/SP',
            turmaId: turma9A2025.id,
            ativo: true,
        },
    });
    console.log('Aluno criado');
    const aluno7 = await prisma.aluno.create({
        data: {
            matricula: '2025007',
            nome: 'Rosalina Ferreira',
            cpf: '77777777777',
            dataNascimento: new Date('2010-12-10'),
            email: 'rosalina.ferreira@email.com',
            telefone: '(11) 98765-4327',
            nomeResponsavel: 'Marcos Ferreira',
            endereco: 'Av. das Palmeiras, 550 - São Paulo/SP',
            turmaId: turma9A2025.id,
            ativo: true,
        },
    });
    console.log('Aluno criado');
    const aluno8 = await prisma.aluno.create({
        data: {
            matricula: '2025008',
            nome: 'Ana Carolina Fonseca',
            cpf: '12312312312',
            dataNascimento: new Date('2010-10-27'),
            email: 'ana.fonseca@email.com',
            telefone: '(11) 93457-3349',
            nomeResponsavel: 'Maria Fonseca',
            endereco: 'Imperatriz do Grimaldi, 2015 - São Paulo/SP',
            turmaId: turma9A2025.id,
            ativo: true,
        },
    });
    console.log('Aluno criado');
    const aluno9 = await prisma.aluno.create({
        data: {
            matricula: '2025009',
            nome: 'Julio Cesar Fonseca',
            cpf: '32132132132',
            dataNascimento: new Date('2009-02-28'),
            email: 'julio.fonseca@email.com',
            telefone: '(11) 93457-3349',
            nomeResponsavel: 'Maria Fonseca',
            endereco: 'Imperatriz do Grimaldi, 2015 - São Paulo/SP',
            turmaId: turma9A2025.id,
            ativo: true,
        },
    });
    console.log('Aluno criado');

    // Alunos da Turma 9º A (2024) - já formados
    const aluno10 = await prisma.aluno.create({
        data: {
            matricula: '2024001',
            nome: 'Henrique Alves',
            cpf: '88888888888',
            dataNascimento: new Date('2009-04-15'),
            email: 'henrique.alves@email.com',
            telefone: '(11) 98765-4328',
            nomeResponsavel: 'Silvia Alves',
            endereco: 'Rua Gentil Fabriano, 112 - São Paulo/SP',
            turmaId: turma9A2024.id,
            ativo: false,
            inativadoAt: new Date('2024-12-20'),
        },
    });
    console.log('Aluno criado');
    const aluno11 = await prisma.aluno.create({
        data: {
            matricula: '2024002',
            nome: 'Isabela Martins',
            cpf: '99999999999',
            dataNascimento: new Date('2009-08-05'),
            email: 'isabela.martins@email.com',
            telefone: '(11) 98765-4329',
            nomeResponsavel: 'Fernando Martins',
            endereco: 'Rua Melo Freitas, 333 - São Paulo/SP',
            turmaId: turma9A2024.id,
            ativo: false,
            inativadoAt: new Date('2024-12-20'),
        },
    });
    console.log('Aluno criado');

    console.log('Tabela de alunos populada com sucesso\n');

    //Popula tabela de notas
    console.log('Populando tabela de notas');

    await prisma.nota.create({
        data: {
            alunoId: aluno1.id,
            disciplinaId: matematica.id,
            bimestre1: 8.0,
            bimestre2: 7.5,
            bimestre3: 7.0,
            bimestre4: 7.5,
            mediaFinal: 7.5,
            criterio: 'Aprovado',
        },
    });
    await prisma.nota.create({
        data: {
            alunoId: aluno2.id,
            disciplinaId: portugues.id,
            bimestre1: 6.0,
            bimestre2: 5.0,
            bimestre3: 4.5,
        },
    });
    await prisma.nota.create({
        data: {
            alunoId: aluno3.id,
            disciplinaId: ciencias.id,
            bimestre1: 5.0,
            bimestre2: 4.5,
            bimestre3: 4.0,
            bimestre4: 4.5,
            mediaFinal: 4.5,
            criterio: 'Reprovado',
        },
    });
    await prisma.nota.create({
        data: {
            alunoId: aluno4.id,
            disciplinaId: matematica.id,
            bimestre1: 7.0,
            bimestre2: 6.5,
            bimestre3: 7.5,
        },
    });
    await prisma.nota.create({
        data: {
            alunoId: aluno5.id,
            disciplinaId: portugues.id,
            bimestre1: 9.0,
            bimestre2: 9.5,
            bimestre3: 10.0,
        },
    });
    await prisma.nota.create({
        data: {
            alunoId: aluno6.id,
            disciplinaId: ciencias.id,
            bimestre1: 6.0,
            bimestre2: 6.0,
            bimestre3: 6.0,
            bimestre4: 6.0,
            mediaFinal: 6.0,
            criterio: 'Aprovado',
        },
    });
    console.log('Tabela de notas populada com sucesso\n');

    //Popula tabela de planejamentos
    console.log('Populando tabela de planejamentos');

    await prisma.planejamento.create({
        data: {
            professorId: profMatematica.id,
            turmaId: turma9A2025.id,
            disciplinaId: matematica.id,
            titulo: 'Equações do 2º Grau',
            data: new Date('2025-01-15'),
        },
    });
    console.log('Planejamento de matemática foi criado');
    await prisma.planejamento.create({
        data: {
            professorId: profMatematica.id,
            turmaId: turma8A2025.id,
            disciplinaId: matematica.id,
            titulo: 'Equações do 1º Grau',
            data: new Date('2025-01-19'),
        },
    });
    await prisma.planejamento.create({
        data: {
            professorId: profPortugues.id,
            turmaId: turma8A2025.id,
            disciplinaId: portugues.id,
            titulo: 'Análise Sintática',
            data: new Date('2025-01-16'),
        },
    });
    console.log('Planejamento de português foi criado');
    await prisma.planejamento.create({
        data: {
            professorId: profCiencias.id,
            turmaId: turma9A2025.id,
            disciplinaId: ciencias.id,
            titulo: 'Sistema Respiratório',
            data: new Date('2025-01-17'),
        },
    });
    console.log('Planejamento de ciências foi criado');
    console.log('Tabela de planejamentos populada com sucesso\n');

    console.log('Seed concluído com sucesso\n');
}


//Roda a função
main()
.catch((e) => {
    console.error('Erro ao executar seed:', e);
    process.exit(1);
})
.finally(async () => {
    await prisma.$disconnect();
});