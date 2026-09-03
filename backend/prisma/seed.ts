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
    await prisma.anoSerie.deleteMany();
    await prisma.disciplina.deleteMany();
    await prisma.usuario.deleteMany();
    console.log('Dados limpos com sucesso\n');

    // Popula tabela de AnoSerie
    console.log('Populando tabela de ano_series');

    // Ensino Fundamental Anos Iniciais
    const ano1 = await prisma.anoSerie.create({
        data: { nome: '1º Ano', etapa: 'Ensino Fundamental Anos Iniciais', ordem: 1 },
    });
    const ano2 = await prisma.anoSerie.create({
        data: { nome: '2º Ano', etapa: 'Ensino Fundamental Anos Iniciais', ordem: 2 },
    });
    const ano3 = await prisma.anoSerie.create({
        data: { nome: '3º Ano', etapa: 'Ensino Fundamental Anos Iniciais', ordem: 3 },
    });
    const ano4 = await prisma.anoSerie.create({
        data: { nome: '4º Ano', etapa: 'Ensino Fundamental Anos Iniciais', ordem: 4 },
    });
    const ano5 = await prisma.anoSerie.create({
        data: { nome: '5º Ano', etapa: 'Ensino Fundamental Anos Iniciais', ordem: 5 },
    });

    // Ensino Fundamental Anos Finais
    const ano6 = await prisma.anoSerie.create({
        data: { nome: '6º Ano', etapa: 'Ensino Fundamental Anos Finais', ordem: 6 },
    });
    const ano7 = await prisma.anoSerie.create({
        data: { nome: '7º Ano', etapa: 'Ensino Fundamental Anos Finais', ordem: 7 },
    });
    const ano8 = await prisma.anoSerie.create({
        data: { nome: '8º Ano', etapa: 'Ensino Fundamental Anos Finais', ordem: 8 },
    });
    const ano9 = await prisma.anoSerie.create({
        data: { nome: '9º Ano', etapa: 'Ensino Fundamental Anos Finais', ordem: 9 },
    });

    // Ensino Médio
    const serie1 = await prisma.anoSerie.create({ data: { nome: '1ª Série', etapa: 'Ensino Médio', ordem: 10 } });
    const serie2 = await prisma.anoSerie.create({ data: { nome: '2ª Série', etapa: 'Ensino Médio', ordem: 11 } });
    const serie3 = await prisma.anoSerie.create({ data: { nome: '3ª Série', etapa: 'Ensino Médio', ordem: 12 } });

    console.log('Tabela de ano_series populada com sucesso\n');

    // Popula tabela de disciplinas
    console.log('Populando tabela de disciplinas');

    const matematica = await prisma.disciplina.create({ data: { nome: 'Matemática', ativo: true } });
    const portugues = await prisma.disciplina.create({ data: { nome: 'Português', ativo: true } });
    const historia = await prisma.disciplina.create({ data: { nome: 'História', ativo: true } });
    const geografia = await prisma.disciplina.create({ data: { nome: 'Geografia', ativo: true } });
    const ciencias = await prisma.disciplina.create({ data: { nome: 'Ciências', ativo: true } });
    const ingles = await prisma.disciplina.create({ data: { nome: 'Inglês', ativo: true } });
    const fisica = await prisma.disciplina.create({ data: { nome: 'Física', ativo: true } });

    console.log('Tabela de disciplinas populada com sucesso\n');

    // Popula tabela de usuarios
    console.log('Populando tabela de usuarios');

    const senhaHash = await bcrypt.hash('senha123', 10);

    const admin = await prisma.usuario.create({
        data: { nome: 'Administrador', email: 'admin@escola.com', senha: senhaHash, perfil: 'admin', ativo: true },
    });
    console.log('Administrador criado');

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
    console.log('Professor de português criado');

    const profCiencias = await prisma.usuario.create({
        data: {
            nome: 'Fagner Januario',
            email: 'fagner.januario@escola.com',
            senha: senhaHash,
            perfil: 'professor',
            ativo: true,
        },
    });
    console.log('Professor de ciências criado');

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

    // Popula tabela de turmas
    console.log('Populando tabela de turmas');

    const turma8A2025 = await prisma.turma.create({
        data: {
            anoSerieId: ano8.id,
            letra: 'A',
            periodo: 'MATUTINO',
            anoLetivo: 2025,
            nomeCompleto: '8º Ano A (2025)',
            ativo: true,
        },
    });
    console.log('8º Ano A (2025) criada');

    const turma8B2025 = await prisma.turma.create({
        data: {
            anoSerieId: ano8.id,
            letra: 'B',
            periodo: 'VESPERTINO',
            anoLetivo: 2025,
            nomeCompleto: '8º Ano B (2025)',
            ativo: true,
        },
    });
    console.log('8º Ano B (2025) criada');

    const turma9A2025 = await prisma.turma.create({
        data: {
            anoSerieId: ano9.id,
            letra: 'A',
            periodo: 'MATUTINO',
            anoLetivo: 2025,
            nomeCompleto: '9º Ano A (2025)',
            ativo: true,
        },
    });
    console.log('9º Ano A (2025) criada');

    const turma9A2024 = await prisma.turma.create({
        data: {
            anoSerieId: ano9.id,
            letra: 'A',
            periodo: 'MATUTINO',
            anoLetivo: 2024,
            nomeCompleto: '9º Ano A (2024)',
            ativo: false,
            inativadoAt: new Date('2024-12-20'),
        },
    });
    console.log('9º Ano A (2024) criada');

    const turma1A2026 = await prisma.turma.create({
        data: {
            anoSerieId: serie1.id,
            letra: 'A',
            periodo: 'MATUTINO',
            anoLetivo: 2026,
            nomeCompleto: '1ª Série A (2026)',
            ativo: true,
        },
    });
    console.log('1ª Série A (2026) criada');
    console.log('Tabela de turmas populada com sucesso\n');

    // Vincula professores às turmas e disciplinas
    console.log('Vinculando professores às turmas e disciplinas');

    await prisma.professorTurma.create({
        data: { professorId: profMatematica.id, turmaId: turma8A2025.id, disciplinaId: matematica.id },
    });
    console.log('Mateus Pontes vinculado a 8º Ano A (2025) - Matemática');

    await prisma.professorTurma.create({
        data: { professorId: profMatematica.id, turmaId: turma9A2025.id, disciplinaId: matematica.id },
    });
    console.log('Mateus Pontes vinculado a 9º Ano A (2025) - Matemática');

    await prisma.professorTurma.create({
        data: { professorId: profPortugues.id, turmaId: turma8A2025.id, disciplinaId: portugues.id },
    });
    console.log('Ellen Melo vinculada a 8º Ano A (2025) - Português');

    await prisma.professorTurma.create({
        data: { professorId: profPortugues.id, turmaId: turma8B2025.id, disciplinaId: portugues.id },
    });
    console.log('Ellen Melo vinculada a 8º Ano B (2025) - Português');

    await prisma.professorTurma.create({
        data: { professorId: profPortugues.id, turmaId: turma9A2025.id, disciplinaId: portugues.id },
    });
    console.log('Ellen Melo vinculada a 9º Ano A (2025) - Português');

    await prisma.professorTurma.create({
        data: { professorId: profCiencias.id, turmaId: turma9A2025.id, disciplinaId: ciencias.id },
    });
    console.log('Fagner Januario vinculado a 9º Ano A (2025) - Ciências');

    await prisma.professorTurma.create({
        data: { professorId: profInativo.id, turmaId: turma9A2024.id, disciplinaId: portugues.id },
    });
    console.log('Pedro Coelho (inativo) vinculado a 9º Ano A (2024) - Português');

    // Todos os professores ativos vinculados à nova turma 1ª Série A (2026)
    await prisma.professorTurma.create({
        data: { professorId: profMatematica.id, turmaId: turma1A2026.id, disciplinaId: matematica.id },
    });
    console.log('Mateus Pontes vinculado a 1ª Série A (2026) - Matemática');

    await prisma.professorTurma.create({
        data: { professorId: profMatematica.id, turmaId: turma1A2026.id, disciplinaId: fisica.id },
    });
    console.log('Mateus Pontes vinculado a 1ª Série A (2026) - Física');

    await prisma.professorTurma.create({
        data: { professorId: profPortugues.id, turmaId: turma1A2026.id, disciplinaId: portugues.id },
    });
    console.log('Ellen Melo vinculada a 1ª Série A (2026) - Português');

    await prisma.professorTurma.create({
        data: { professorId: profCiencias.id, turmaId: turma1A2026.id, disciplinaId: ciencias.id },
    });
    console.log('Fagner Januario vinculado a 1ª Série A (2026) - Ciências');
    console.log('Vínculos criados com sucesso\n');

    // Popula tabela de alunos
    console.log('Populando tabela de alunos');

    // Alunos da Turma 8º Ano A (2025)
    const aluno1 = await prisma.aluno.create({
        data: {
            matricula: '2025001',
            nome: 'Ana Paula Silva',
            cpf: '11111111111',
            dataNascimento: new Date('2011-03-15'),
            email: 'ana.silva@email.com',
            telefone: '11987654321',
            nomeResponsavel: 'Carlos Silva',
            endereco: 'Rua Cumbe, 80 - São Paulo/SP',
            turmaId: turma8A2025.id,
            ativo: true,
            createdAt: new Date('2025-01-05'),
        },
    });
    const aluno2 = await prisma.aluno.create({
        data: {
            matricula: '2025002',
            nome: 'Bruno Costa',
            cpf: '22222222222',
            dataNascimento: new Date('2011-07-22'),
            email: 'bruno.costa@email.com',
            telefone: '11987654322',
            nomeResponsavel: 'Maria Costa',
            endereco: 'Av. Paulista, 1000 - São Paulo/SP',
            turmaId: turma8A2025.id,
            ativo: true,
            createdAt: new Date('2025-01-05'),
        },
    });
    const aluno3 = await prisma.aluno.create({
        data: {
            matricula: '2025003',
            nome: 'Carla Mendes',
            cpf: '33333333333',
            dataNascimento: new Date('2011-11-08'),
            email: 'carla.mendes@email.com',
            telefone: '11987654323',
            nomeResponsavel: 'João Mendes',
            endereco: 'Rua Augusta, 250 - São Paulo/SP',
            turmaId: turma8A2025.id,
            ativo: true,
            createdAt: new Date('2025-01-05'),
        },
    });

    // Alunos da Turma 8º Ano B (2025)
    const aluno4 = await prisma.aluno.create({
        data: {
            matricula: '2025004',
            nome: 'Daniel Souza',
            cpf: '44444444444',
            dataNascimento: new Date('2011-01-30'),
            email: 'daniel.souza@email.com',
            telefone: '11987654324',
            nomeResponsavel: 'Ana Luiza Souza',
            endereco: 'Rua Germano Limeira, 128 - São Paulo/SP',
            turmaId: turma8B2025.id,
            ativo: true,
            createdAt: new Date('2025-01-05'),
        },
    });
    const aluno5 = await prisma.aluno.create({
        data: {
            matricula: '2025005',
            nome: 'Eduarda Lima',
            cpf: '55555555555',
            dataNascimento: new Date('2011-05-18'),
            email: 'eduarda.lima@email.com',
            telefone: '11987654325',
            nomeResponsavel: 'Roberto Lima',
            endereco: 'Av. Central, 452 - São Paulo/SP',
            turmaId: turma8B2025.id,
            ativo: true,
            createdAt: new Date('2025-01-05'),
        },
    });

    // Alunos da Turma 9º Ano A (2025)
    const aluno6 = await prisma.aluno.create({
        data: {
            matricula: '2025006',
            nome: 'Fernando Rocha',
            cpf: '66666666666',
            dataNascimento: new Date('2010-09-25'),
            email: 'fernando.rocha@email.com',
            telefone: '11987654326',
            nomeResponsavel: 'Patrícia Rocha',
            endereco: 'Rua Japão, 514 - São Paulo/SP',
            turmaId: turma9A2025.id,
            ativo: true,
            createdAt: new Date('2025-01-05'),
        },
    });
    const aluno7 = await prisma.aluno.create({
        data: {
            matricula: '2025007',
            nome: 'Rosalina Ferreira',
            cpf: '77777777777',
            dataNascimento: new Date('2010-12-10'),
            email: 'rosalina.ferreira@email.com',
            telefone: '11987654327',
            nomeResponsavel: 'Marcos Ferreira',
            endereco: 'Av. das Palmeiras, 550 - São Paulo/SP',
            turmaId: turma9A2025.id,
            ativo: true,
            createdAt: new Date('2025-01-05'),
        },
    });
    const aluno8 = await prisma.aluno.create({
        data: {
            matricula: '2025008',
            nome: 'Ana Carolina Fonseca',
            cpf: '12312312312',
            dataNascimento: new Date('2010-10-27'),
            email: 'ana.fonseca@email.com',
            telefone: '11934573349',
            nomeResponsavel: 'Maria Fonseca',
            endereco: 'Imperatriz do Grimaldi, 2015 - São Paulo/SP',
            turmaId: turma9A2025.id,
            ativo: true,
            createdAt: new Date('2025-01-05'),
        },
    });
    const aluno9 = await prisma.aluno.create({
        data: {
            matricula: '2025009',
            nome: 'Julio Cesar Fonseca',
            cpf: '32132132132',
            dataNascimento: new Date('2009-02-28'),
            email: 'julio.fonseca@email.com',
            telefone: '11934573349',
            nomeResponsavel: 'Maria Fonseca',
            endereco: 'Imperatriz do Grimaldi, 2015 - São Paulo/SP',
            turmaId: turma9A2025.id,
            ativo: true,
            createdAt: new Date('2025-01-05'),
        },
    });

    // Alunos da Turma 9º Ano A (2024) - já formados
    const aluno10 = await prisma.aluno.create({
        data: {
            matricula: '2024001',
            nome: 'Henrique Alves',
            cpf: '88888888888',
            dataNascimento: new Date('2009-04-15'),
            email: 'henrique.alves@email.com',
            telefone: '11987654328',
            nomeResponsavel: 'Silvia Alves',
            endereco: 'Rua Gentil Fabriano, 112 - São Paulo/SP',
            turmaId: turma9A2024.id,
            ativo: false,
            createdAt: new Date('2024-02-01'),
            inativadoAt: new Date('2024-12-20'),
        },
    });
    const aluno11 = await prisma.aluno.create({
        data: {
            matricula: '2024002',
            nome: 'Isabela Martins',
            cpf: '99999999999',
            dataNascimento: new Date('2009-08-05'),
            email: 'isabela.martins@email.com',
            telefone: '11987654329',
            nomeResponsavel: 'Fernando Martins',
            endereco: 'Rua Melo Freitas, 333 - São Paulo/SP',
            turmaId: turma9A2024.id,
            ativo: false,
            createdAt: new Date('2024-02-01'),
            inativadoAt: new Date('2024-12-20'),
        },
    });

    console.log('Tabela de alunos populada com sucesso\n');

    // Popula tabela de notas
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
            resultado: 'Aprovado',
        },
    });
    await prisma.nota.create({
        data: {
            alunoId: aluno2.id,
            disciplinaId: portugues.id,
            bimestre1: 6.0,
            bimestre2: 5.0,
            bimestre3: 4.5,
            mediaParcial: 5.2,
            resultado: 'Cursando',
        },
    });
    // Reprovado pela média (4.5), mas com motivoAprovacao registrado pelo Conselho de Classe -
    // resultado é sobrescrito para 'Aprovado' (mesma regra de editaMotivoAprovacao no notaController)
    await prisma.nota.create({
        data: {
            alunoId: aluno3.id,
            disciplinaId: ciencias.id,
            bimestre1: 5.0,
            bimestre2: 4.5,
            bimestre3: 4.0,
            bimestre4: 4.5,
            mediaFinal: 4.5,
            resultado: 'Aprovado',
            motivoAprovacao: 'Conselho de Classe',
        },
    });
    await prisma.nota.create({
        data: {
            alunoId: aluno4.id,
            disciplinaId: matematica.id,
            bimestre1: 7.0,
            bimestre2: 6.5,
            bimestre3: 7.5,
            mediaParcial: 7.0,
            resultado: 'Cursando',
        },
    });
    await prisma.nota.create({
        data: {
            alunoId: aluno5.id,
            disciplinaId: portugues.id,
            bimestre1: 9.0,
            bimestre2: 9.5,
            bimestre3: 10.0,
            mediaParcial: 9.5,
            resultado: 'Cursando',
        },
    });
    // Aprovado por média e presença - vai receber uma falta justificada mais abaixo,
    // mas sem faltas suficientes para reprovar (ver seção de Faltas)
    await prisma.nota.create({
        data: {
            alunoId: aluno6.id,
            disciplinaId: ciencias.id,
            bimestre1: 6.0,
            bimestre2: 6.0,
            bimestre3: 6.0,
            bimestre4: 6.0,
            mediaFinal: 6.0,
            resultado: 'Aprovado',
        },
    });
    // aluno7 (Rosalina Ferreira) fica sem nenhum registro de Nota - exemplo de aluno ainda sem notas lançadas

    // Reprovado pela média (4.75), independente de faltas
    await prisma.nota.create({
        data: {
            alunoId: aluno8.id,
            disciplinaId: ciencias.id,
            bimestre1: 5.0,
            bimestre2: 5.5,
            bimestre3: 4.0,
            bimestre4: 4.5,
            mediaFinal: 4.75,
            resultado: 'Reprovado',
        },
    });
    // Média 7.0 seria suficiente pra aprovar, mas a presença (ver Faltas abaixo) fica abaixo de 75% -
    // reprovado por falta, não por nota
    await prisma.nota.create({
        data: {
            alunoId: aluno9.id,
            disciplinaId: ciencias.id,
            bimestre1: 7.0,
            bimestre2: 7.5,
            bimestre3: 7.0,
            bimestre4: 6.5,
            mediaFinal: 7.0,
            resultado: 'Reprovado',
        },
    });

    console.log('Tabela de notas populada com sucesso\n');

    // Popula tabela de planejamentos
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
    const planejamentoSistemaRespiratorio = await prisma.planejamento.create({
        data: {
            professorId: profCiencias.id,
            turmaId: turma9A2025.id,
            disciplinaId: ciencias.id,
            titulo: 'Sistema Respiratório',
            data: new Date('2025-01-17'),
        },
    });

    // Planejamentos extras de Ciências (9º Ano A) para dar volume real de aulas
    // e permitir demonstrar reprovação por falta de forma realista
    const planejamentoSistemaCirculatorio = await prisma.planejamento.create({
        data: {
            professorId: profCiencias.id,
            turmaId: turma9A2025.id,
            disciplinaId: ciencias.id,
            titulo: 'Sistema Circulatório',
            numeroAulas: 2,
            data: new Date('2025-01-24'),
        },
    });
    await prisma.planejamento.create({
        data: {
            professorId: profCiencias.id,
            turmaId: turma9A2025.id,
            disciplinaId: ciencias.id,
            titulo: 'Sistema Digestório',
            numeroAulas: 2,
            data: new Date('2025-01-31'),
        },
    });
    const planejamentoSistemaNervoso = await prisma.planejamento.create({
        data: {
            professorId: profCiencias.id,
            turmaId: turma9A2025.id,
            disciplinaId: ciencias.id,
            titulo: 'Sistema Nervoso',
            numeroAulas: 3,
            data: new Date('2025-02-07'),
        },
    });

    console.log('Tabela de planejamentos populada com sucesso\n');

    // Popula tabela de faltas
    console.log('Populando tabela de faltas');

    // aluno6 (Fernando Rocha): 1 falta justificada em 8 aulas (87,5% de presença) -
    // fica acima dos 75% mínimos, continua Aprovado mesmo com uma falta registrada
    await prisma.falta.create({
        data: {
            alunoId: aluno6.id,
            planejamentoId: planejamentoSistemaNervoso.id,
            quantidadeFaltas: 1,
            justificativa: 'Consulta médica agendada',
        },
    });
    console.log('Falta justificada de Fernando Rocha lançada (Sistema Nervoso)');

    // aluno9 (Julio Cesar Fonseca): 3 faltas em 8 aulas (62,5% de presença) -
    // abaixo dos 75% mínimos, reprova por falta mesmo com média 7.0 na disciplina
    await prisma.falta.create({
        data: {
            alunoId: aluno9.id,
            planejamentoId: planejamentoSistemaRespiratorio.id,
            quantidadeFaltas: 1,
            justificativa: 'Atestado médico',
        },
    });
    console.log('Falta justificada de Julio Cesar Fonseca lançada (Sistema Respiratório)');

    await prisma.falta.create({
        data: {
            alunoId: aluno9.id,
            planejamentoId: planejamentoSistemaCirculatorio.id,
            quantidadeFaltas: 2,
        },
    });
    console.log('Falta (não justificada) de Julio Cesar Fonseca lançada (Sistema Circulatório)');

    console.log('Tabela de faltas populada com sucesso\n');

    console.log('Seed concluído com sucesso\n');
}

main()
    .catch((e) => {
        console.error('Erro ao executar seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
