import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';

const alunosPorPagina = 10;

const DetalhesTurma = () => {
    const navigate = useNavigate();
    const { id } = useParams();

    // Estados principais
    const [turma, setTurma] = useState(null);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState(null);
    const [mensagem, setMensagem] = useState({ tipo: '', texto: '' });

    // Estado de paginação local dos alunos
    const [paginaAlunos, setPaginaAlunos] = useState(1);

    // Estados do modal de vincular
    const [modalVincular, setModalVincular] = useState(false);
    const [alunosSemTurma, setAlunosSemTurma] = useState([]);
    const [loadingAlunos, setLoadingAlunos] = useState(false);
    const [alunosSelecionados, setAlunosSelecionados] = useState([]);
    const [vinculando, setVinculando] = useState(false);
    const [buscaAluno, setBuscaAluno] = useState('');

    // Estados do modal de desvincular
    const [modalDesvincular, setModalDesvincular] = useState({
        aberto: false,
        alunoId: null,
        alunoNome: '',
    });
    const [desvinculando, setDesvinculando] = useState(false);

    // Formata período para exibição
    const formataPeriodo = (periodo) => {
        const periodos = {
            MATUTINO: 'Matutino',
            VESPERTINO: 'Vespertino',
            NOTURNO: 'Noturno',
        };
        return periodos[periodo] || periodo;
    };

    // Formata data para exibição (DD/MM/AAAA)
    const formataData = (data) => {
        if (!data) return '-';
        return new Date(data).toLocaleDateString('pt-BR');
    };

    // Mostra mensagem temporária de feedback
    const mostraMensagem = (tipo, texto) => {
        setMensagem({ tipo, texto });
        setTimeout(() => setMensagem({ tipo: '', texto: '' }), 4000);
    };

    // Carrega dados da turma
    const carregaTurma = async () => {
        try {
            setLoading(true);
            setErro(null);
            const response = await api.get(`/turmas/${id}`);
            setTurma(response.data.dados);
            setPaginaAlunos(1);
        } catch (error) {
            console.error('Erro ao buscar turma:', error);
            setErro(error.response?.data?.mensagem || 'Erro ao carregar turma. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    // Carrega alunos ativos sem turma
    const carregaAlunosSemTurma = async () => {
        try {
            setLoadingAlunos(true);
            const response = await api.get('/alunos', {
                params: {
                    status: 'ativo',
                    turmaId: 'null',
                    limit: 9999,
                },
            });
            const dados = response.data.dados || response.data;
            setAlunosSemTurma(dados.alunos || []);
        } catch (error) {
            console.error('Erro ao buscar alunos sem turma:', error);
            mostraMensagem('erro', 'Erro ao carregar alunos disponíveis.');
        } finally {
            setLoadingAlunos(false);
        }
    };

    useEffect(() => {
        carregaTurma();
    }, [id]);

    // Navega entre páginas de alunos
    const mudaPaginaAlunos = (novaPagina) => {
        if (novaPagina >= 1 && novaPagina <= totalPaginasAlunos) {
            setPaginaAlunos(novaPagina);
        }
    };

    // Abre modal de vincular alunos
    const abreModalVincular = () => {
        setAlunosSelecionados([]);
        setBuscaAluno('');
        setModalVincular(true);
        carregaAlunosSemTurma();
    };

    // Fecha modal de vincular alunos
    const fechaModalVincular = () => {
        setModalVincular(false);
        setAlunosSelecionados([]);
        setBuscaAluno('');
    };

    // Abre modal de desvincular aluno
    const abreModalDesvincular = (aluno) => {
        setModalDesvincular({
            aberto: true,
            alunoId: aluno.id,
            alunoNome: aluno.nome,
        });
    };

    // Fecha modal de desvincular aluno
    const fechaModalDesvincular = () => {
        setModalDesvincular({
            aberto: false,
            alunoId: null,
            alunoNome: '',
        });
    };

    // Confirma desvinculação do aluno
    const confirmaDesvinculacao = async () => {
        try {
            setDesvinculando(true);
            await api.put(`/alunos/${modalDesvincular.alunoId}/desvincular`);
            mostraMensagem('sucesso', `Aluno ${modalDesvincular.alunoNome} desvinculado`);
            fechaModalDesvincular();
            carregaTurma();
        } catch (error) {
            console.error('Erro ao desvincular aluno:', error);
            mostraMensagem('erro', error.response?.data?.mensagem || 'Erro ao desvincular aluno.');
            fechaModalDesvincular();
        } finally {
            setDesvinculando(false);
        }
    };

    // Marca ou desmarca um aluno individualmente
    const toggleAluno = (aluno) => {
        setAlunosSelecionados((prev) => {
            const jaSelecionado = prev.some((a) => a.id === aluno.id);
            if (jaSelecionado) {
                return prev.filter((a) => a.id !== aluno.id);
            }
            return [...prev, aluno];
        });
    };

    // Marca ou desmarca todos os alunos filtrados
    const toggleTodos = () => {
        const todosMarcados = alunosFiltrados.every((a) => alunosSelecionados.some((s) => s.id === a.id));

        if (todosMarcados) {
            setAlunosSelecionados((prev) => prev.filter((s) => !alunosFiltrados.some((a) => a.id === s.id)));
        } else {
            setAlunosSelecionados((prev) => {
                const novos = alunosFiltrados.filter((a) => !prev.some((s) => s.id === a.id));
                return [...prev, ...novos];
            });
        }
    };

    // Confirma vinculação de todos os alunos selecionados
    const confirmaVinculacao = async () => {
        if (alunosSelecionados.length === 0) return;

        try {
            setVinculando(true);

            await Promise.all(
                alunosSelecionados.map((aluno) => api.put(`/alunos/${aluno.id}/vincular`, { turmaId: id })),
            );

            const quantidade = alunosSelecionados.length;
            mostraMensagem(
                'sucesso',
                quantidade === 1 ? `Aluno ${alunosSelecionados[0].nome} vinculado` : `${quantidade} alunos vinculados`,
            );
            fechaModalVincular();
            carregaTurma();
        } catch (error) {
            console.error('Erro ao vincular alunos:', error);
            mostraMensagem('erro', error.response?.data?.mensagem || 'Erro ao vincular alunos.');
            fechaModalVincular();
        } finally {
            setVinculando(false);
        }
    };

    // Filtra alunos pelo campo de busca do modal
    const alunosFiltrados = alunosSemTurma.filter(
        (aluno) =>
            aluno.nome.toLowerCase().includes(buscaAluno.toLowerCase()) ||
            aluno.matricula.toLowerCase().includes(buscaAluno.toLowerCase()),
    );

    // Verifica se todos os alunos filtrados estão marcados
    const todosMarcados =
        alunosFiltrados.length > 0 && alunosFiltrados.every((a) => alunosSelecionados.some((s) => s.id === a.id));

    // Calcula estatísticas de alunos
    const totalAlunos = turma?._count?.alunos ?? 0;
    const alunosAtivos = turma?.alunos?.length ?? 0;
    const alunosInativos = totalAlunos - alunosAtivos;

    // Paginação local dos alunos ativos
    const totalPaginasAlunos = Math.ceil(alunosAtivos / alunosPorPagina);
    const alunosPaginados =
        turma?.alunos?.slice((paginaAlunos - 1) * alunosPorPagina, paginaAlunos * alunosPorPagina) ?? [];

    return (
        <div className="content">
            {/* Header */}
            <div className="content-header">
                <h1 className="content-title">Detalhes da Turma</h1>
                <div className="content-action">
                    <button onClick={() => navigate('/turmas')} className="btn btn-secondary">
                        ← Voltar
                    </button>
                    <button onClick={() => navigate(`/turmas/${id}`)} className="btn btn-primary">
                        ✏️ Editar
                    </button>
                </div>
            </div>

            {/* Mensagem de Feedback */}
            {mensagem.texto && <div className={`alert alert-${mensagem.tipo}`}>{mensagem.texto}</div>}

            {/* Loading */}
            {loading && (
                <div className="loading">
                    <p>Carregando dados da turma...</p>
                </div>
            )}

            {/* Erro */}
            {erro && !loading && (
                <div className="error">
                    <p>⚠️ {erro}</p>
                    <button onClick={carregaTurma} className="btn btn-primary">
                        Tentar Novamente
                    </button>
                </div>
            )}

            {/* Conteúdo */}
            {!loading && !erro && turma && (
                <>
                    {/* Informações Gerais */}
                    <div className="card" style={{ marginBottom: '30px' }}>
                        <div className="card-header">
                            <h2 className="card-section-title">📋 Informações Gerais</h2>
                        </div>
                        <div className="card-body">
                            <div className="form-grid">
                                <div className="input-group">
                                    <span className="input-label">Nome da Turma</span>
                                    <span style={{ fontSize: '16px', fontWeight: '600', color: '#2c3e50' }}>
                                        {turma.nomeCompleto}
                                    </span>
                                </div>

                                <div className="input-group">
                                    <span className="input-label">Status</span>
                                    <span>
                                        <span className={`badge ${turma.ativo ? 'badge-verde' : 'badge-vermelha'}`}>
                                            {turma.ativo ? 'Ativo' : 'Inativo'}
                                        </span>
                                    </span>
                                </div>

                                <div className="input-group">
                                    <span className="input-label">Etapa de Ensino</span>
                                    <span className="input-value">{turma.anoSerie?.etapa || '-'}</span>
                                </div>

                                <div className="input-group">
                                    <span className="input-label">Ano / Série</span>
                                    <span className="input-value">{turma.anoSerie?.nome || '-'}</span>
                                </div>

                                <div className="input-group">
                                    <span className="input-label">Ano Letivo</span>
                                    <span className="input-value">{turma.anoLetivo}</span>
                                </div>

                                <div className="input-group">
                                    <span className="input-label">Período</span>
                                    <span className="input-value">{formataPeriodo(turma.periodo)}</span>
                                </div>

                                {turma.letra && (
                                    <div className="input-group">
                                        <span className="input-label">Letra</span>
                                        <span className="input-value">{turma.letra}</span>
                                    </div>
                                )}

                                <div className="input-group">
                                    <span className="input-label">Cadastrada em</span>
                                    <span className="input-value">{formataData(turma.createdAt)}</span>
                                </div>

                                {!turma.ativo && turma.inativadoAt && (
                                    <div className="input-group">
                                        <span className="input-label">Inativada em</span>
                                        <span className="input-value" style={{ color: '#e74c3c' }}>
                                            {formataData(turma.inativadoAt)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Estatísticas de Alunos */}
                    <div className="card" style={{ marginBottom: '30px' }}>
                        <div className="card-header">
                            <h2 className="card-section-title">📊 Estatísticas de Alunos</h2>
                        </div>
                        <div className="card-body">
                            <div className="cards-container">
                                <div className="card-stats">
                                    <p className="card-stats-label">Total</p>
                                    <p className="card-stats-number">{totalAlunos}</p>
                                </div>
                                <div className="card-stats">
                                    <p className="card-stats-label">Ativos</p>
                                    <p className="card-stats-number" style={{ color: '#27ae60' }}>
                                        {alunosAtivos}
                                    </p>
                                </div>
                                <div className="card-stats">
                                    <p className="card-stats-label">Inativos</p>
                                    <p className="card-stats-number" style={{ color: '#e74c3c' }}>
                                        {alunosInativos}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Alunos Ativos Vinculados */}
                    <div className="card" style={{ marginBottom: '30px' }}>
                        <div className="card-header card-header-action">
                            <h2 className="card-section-title">🎒 Alunos Ativos ({alunosAtivos})</h2>
                            {turma.ativo && (
                                <button
                                    onClick={abreModalVincular}
                                    className="btn btn-primary"
                                    style={{ minWidth: 'auto' }}
                                >
                                    + Adicionar Aluno
                                </button>
                            )}
                        </div>
                        <div className="card-body" style={{ padding: '0' }}>
                            {alunosAtivos === 0 ? (
                                <div className="empty" style={{ padding: '30px' }}>
                                    <p>Nenhum aluno ativo vinculado a esta turma</p>
                                </div>
                            ) : (
                                <>
                                    <div className="table-container">
                                        <table className="table table-alunos-turma">
                                            <thead>
                                                <tr>
                                                    <th>Matrícula</th>
                                                    <th>Nome</th>
                                                    <th>Data de Nasc.</th>
                                                    <th>E-mail</th>
                                                    <th>Ações</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {alunosPaginados.map((aluno) => (
                                                    <tr key={aluno.id}>
                                                        <td data-label="Matrícula">{aluno.matricula}</td>
                                                        <td data-label="Nome" style={{ fontWeight: '600' }}>
                                                            {aluno.nome}
                                                        </td>
                                                        <td data-label="Data de Nasc.">
                                                            {formataData(aluno.dataNascimento)}
                                                        </td>
                                                        <td data-label="E-mail">{aluno.email || '-'}</td>
                                                        <td data-label="Ações">
                                                            {/* Botões Desktop */}
                                                            <div className="table-action">
                                                                <button
                                                                    onClick={() => navigate(`/alunos/${aluno.id}`)}
                                                                    className="btn-action"
                                                                    title="Editar aluno"
                                                                >
                                                                    ✏️
                                                                </button>
                                                                <button
                                                                    onClick={() => abreModalDesvincular(aluno)}
                                                                    className="btn-action"
                                                                    title="Desvincular aluno"
                                                                >
                                                                    🔗
                                                                </button>
                                                            </div>

                                                            {/* Botões Mobile */}
                                                            <div className="table-action table-action-mobile">
                                                                <button
                                                                    onClick={() => navigate(`/alunos/${aluno.id}`)}
                                                                    className="btn-mobile btn-mobile-edit"
                                                                >
                                                                    Editar
                                                                </button>
                                                                <button
                                                                    onClick={() => abreModalDesvincular(aluno)}
                                                                    className="btn-mobile btn-mobile-delete"
                                                                >
                                                                    Desvincular
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Paginação */}
                                    <div className="page-container">
                                        <div className="page-info">
                                            <p>
                                                Mostrando {(paginaAlunos - 1) * alunosPorPagina + 1}
                                                {' a '}
                                                {Math.min(paginaAlunos * alunosPorPagina, alunosAtivos)}
                                                {' de '}
                                                {alunosAtivos} aluno(s)
                                            </p>
                                        </div>

                                        {totalPaginasAlunos > 1 && (
                                            <div className="page-controller">
                                                <button
                                                    onClick={() => mudaPaginaAlunos(1)}
                                                    disabled={paginaAlunos === 1}
                                                    className="page-btn"
                                                    title="Primeira página"
                                                >
                                                    «
                                                </button>

                                                <button
                                                    onClick={() => mudaPaginaAlunos(paginaAlunos - 1)}
                                                    disabled={paginaAlunos === 1}
                                                    className="page-btn"
                                                    title="Página anterior"
                                                >
                                                    ‹
                                                </button>

                                                <div className="page-number">
                                                    {paginaAlunos > 2 && (
                                                        <>
                                                            <button
                                                                onClick={() => mudaPaginaAlunos(1)}
                                                                className="page-btn"
                                                            >
                                                                1
                                                            </button>
                                                            {paginaAlunos > 3 && (
                                                                <span className="page-others">...</span>
                                                            )}
                                                        </>
                                                    )}

                                                    {paginaAlunos > 1 && (
                                                        <button
                                                            onClick={() => mudaPaginaAlunos(paginaAlunos - 1)}
                                                            className="page-btn"
                                                        >
                                                            {paginaAlunos - 1}
                                                        </button>
                                                    )}

                                                    <button className="page-btn active">{paginaAlunos}</button>

                                                    {paginaAlunos < totalPaginasAlunos && (
                                                        <button
                                                            onClick={() => mudaPaginaAlunos(paginaAlunos + 1)}
                                                            className="page-btn"
                                                        >
                                                            {paginaAlunos + 1}
                                                        </button>
                                                    )}

                                                    {paginaAlunos < totalPaginasAlunos - 1 && (
                                                        <>
                                                            {paginaAlunos < totalPaginasAlunos - 2 && (
                                                                <span className="page-others">...</span>
                                                            )}
                                                            <button
                                                                onClick={() => mudaPaginaAlunos(totalPaginasAlunos)}
                                                                className="page-btn"
                                                            >
                                                                {totalPaginasAlunos}
                                                            </button>
                                                        </>
                                                    )}
                                                </div>

                                                <button
                                                    onClick={() => mudaPaginaAlunos(paginaAlunos + 1)}
                                                    disabled={paginaAlunos === totalPaginasAlunos}
                                                    className="page-btn"
                                                    title="Próxima página"
                                                >
                                                    ›
                                                </button>

                                                <button
                                                    onClick={() => mudaPaginaAlunos(totalPaginasAlunos)}
                                                    disabled={paginaAlunos === totalPaginasAlunos}
                                                    className="page-btn"
                                                    title="Última página"
                                                >
                                                    »
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Professores e Disciplinas Vinculados */}
                    <div className="card" style={{ marginBottom: '30px' }}>
                        <div className="card-header">
                            <h2 className="card-section-title">
                                👨‍🏫 Professores e Disciplinas ({turma.professorTurmas?.length ?? 0})
                            </h2>
                        </div>
                        <div className="card-body" style={{ padding: '0' }}>
                            {turma.professorTurmas?.length === 0 ? (
                                <div className="empty" style={{ padding: '30px' }}>
                                    <p>Nenhum professor vinculado a esta turma</p>
                                </div>
                            ) : (
                                <div className="table-container">
                                    <table className="table table-professores-turma">
                                        <thead>
                                            <tr>
                                                <th>Professor</th>
                                                <th>Disciplina</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {turma.professorTurmas?.map((pt) => (
                                                <tr key={pt.id}>
                                                    <td data-label="Professor" style={{ fontWeight: '600' }}>
                                                        {pt.professor?.nome || '-'}
                                                    </td>
                                                    <td data-label="Disciplina">
                                                        <span className="badge badge-azul">
                                                            {pt.disciplina?.nome || '-'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* Modal de Vincular Alunos */}
            {modalVincular && (
                <div className="modal-overlay" onClick={fechaModalVincular}>
                    <div className="modal-content" style={{ maxWidth: '620px' }} onClick={(e) => e.stopPropagation()}>
                        <h2>➕ Adicionar Alunos à Turma</h2>
                        <p>
                            Selecione os alunos ativos sem turma para vincular a <strong>{turma?.nomeCompleto}</strong>.
                        </p>

                        {/* Campo de Busca */}
                        <div className="input-group" style={{ marginBottom: '15px' }}>
                            <input
                                type="text"
                                placeholder="Buscar por nome ou matrícula..."
                                value={buscaAluno}
                                onChange={(e) => setBuscaAluno(e.target.value)}
                                className="input-field"
                            />
                        </div>

                        {/* Lista de Alunos Disponíveis */}
                        {loadingAlunos ? (
                            <div className="loading" style={{ padding: '20px' }}>
                                <p>Carregando alunos...</p>
                            </div>
                        ) : alunosSemTurma.length === 0 ? (
                            <div className="empty" style={{ padding: '20px' }}>
                                <p>Nenhum aluno ativo sem turma disponível</p>
                            </div>
                        ) : alunosFiltrados.length === 0 ? (
                            <div className="empty" style={{ padding: '20px' }}>
                                <p>Nenhum aluno encontrado para esta busca</p>
                            </div>
                        ) : (
                            <div
                                style={{
                                    maxHeight: '300px',
                                    overflowY: 'auto',
                                    border: '1px solid #e0e0e0',
                                    borderRadius: '8px',
                                    marginBottom: '15px',
                                }}
                            >
                                <table className="table" style={{ marginBottom: '0' }}>
                                    <thead>
                                        <tr>
                                            <th style={{ width: '40px', textAlign: 'center' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={todosMarcados}
                                                    onChange={toggleTodos}
                                                    title="Selecionar todos"
                                                />
                                            </th>
                                            <th>Matrícula</th>
                                            <th>Nome</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {alunosFiltrados.map((aluno) => {
                                            const selecionado = alunosSelecionados.some((s) => s.id === aluno.id);
                                            return (
                                                <tr
                                                    key={aluno.id}
                                                    onClick={() => toggleAluno(aluno)}
                                                    style={{
                                                        cursor: 'pointer',
                                                        backgroundColor: selecionado ? '#d1ecf1' : '',
                                                    }}
                                                >
                                                    <td data-label="Selecionar" style={{ textAlign: 'center' }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={selecionado}
                                                            onChange={() => toggleAluno(aluno)}
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                    </td>
                                                    <td data-label="Matrícula">{aluno.matricula}</td>
                                                    <td data-label="Nome" style={{ fontWeight: '600' }}>
                                                        {aluno.nome}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Contador de Selecionados */}
                        {alunosSelecionados.length > 0 && (
                            <p style={{ fontSize: '14px', color: '#0c5460', marginBottom: '10px' }}>
                                {alunosSelecionados.length} aluno(s) selecionado(s)
                            </p>
                        )}

                        <div className="modal-action">
                            <button onClick={fechaModalVincular} className="btn btn-secondary">
                                Cancelar
                            </button>
                            <button
                                onClick={confirmaVinculacao}
                                className="btn btn-primary"
                                disabled={alunosSelecionados.length === 0 || vinculando}
                            >
                                {vinculando
                                    ? 'Vinculando...'
                                    : `Vincular ${alunosSelecionados.length > 0 ? `(${alunosSelecionados.length})` : ''}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Confirmação de Desvinculação */}
            {modalDesvincular.aberto && (
                <div className="modal-overlay" onClick={fechaModalDesvincular}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>🔗 Desvincular Aluno</h2>
                        <p>
                            Deseja realmente desvincular o aluno <strong>{modalDesvincular.alunoNome}</strong> desta
                            turma?
                        </p>
                        <p className="modal-warning">O aluno ficará sem turma e não receberá novas avaliações.</p>
                        <div className="modal-action">
                            <button onClick={fechaModalDesvincular} className="btn btn-secondary">
                                Cancelar
                            </button>
                            <button onClick={confirmaDesvinculacao} className="btn btn-danger" disabled={desvinculando}>
                                {desvinculando ? 'Desvinculando...' : 'Desvincular'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DetalhesTurma;
