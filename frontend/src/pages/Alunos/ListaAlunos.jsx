import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const ListaAlunos = () => {
    const navigate = useNavigate();

    // Estados
    const [alunos, setAlunos] = useState([]);
    const [turmas, setTurmas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState(null);
    const [filtros, setFiltros] = useState({
        status: 'todos',
        turmaId: 'todas',
        busca: '',
    });
    const [paginacao, setPaginacao] = useState({
        paginaAtual: 1,
        itensPorPagina: 10,
        totalItens: 0,
        totalPaginas: 0,
    });
    const [ordenacao, setOrdenacao] = useState({
        campo: 'nome',
        ordem: 'asc',
    });
    const [modalExcluir, setModalExcluir] = useState({
        aberto: false,
        alunoId: null,
        alunoNome: '',
    });
    const [modalStatus, setModalStatus] = useState({
        aberto: false,
        alunoId: null,
        alunoNome: '',
        statusAtual: false,
    });

    const [modalFiltros, setModalFiltros] = useState(false);
    const [filtrosTemp, setFiltrosTemp] = useState({
        status: 'todos',
        turmaId: 'todas',
        busca: '',
    });
    const [mensagem, setMensagem] = useState({
        tipo: '',
        texto: '',
    });

    // Identifica usuário logado
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const admin = user?.perfil === 'admin';

    // Busca alunos
    const buscaAlunos = async () => {
        try {
            setLoading(true);
            setErro(null);

            const params = {
                ordenarPor: ordenacao.campo,
                ordem: ordenacao.ordem,
                limit: paginacao.itensPorPagina,
                offset: (paginacao.paginaAtual - 1) * paginacao.itensPorPagina,
            };

            // Aplica filtros
            if (filtros.status !== 'todos') {
                params.status = filtros.status;
            }
            if (filtros.turmaId !== 'todas') {
                params.turmaId = filtros.turmaId;
            }
            if (filtros.busca.trim()) {
                params.nome = filtros.busca.trim();
            }

            const response = await api.get('/alunos', { params });

            const dados = response.data.dados || response.data;
            setAlunos(dados.alunos || dados || []);

            // Atualiza informações de paginação
            if (dados.paginacao) {
                setPaginacao((prev) => ({
                    ...prev,
                    totalItens: dados.paginacao.total,
                    totalPaginas: dados.paginacao.totalPaginas,
                }));
            }
        } catch (error) {
            console.error('Erro ao buscar alunos:', error);
            setErro(error.response?.data?.mensagem || 'Erro ao carregar alunos. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    // Busca turmas
    const buscaTurmas = async () => {
        try {
            const response = await api.get('/turmas');
            setTurmas(response.data.dados?.turmas || response.data || []);
        } catch (error) {
            console.error('Erro ao buscar turmas:', error);
        }
    };

    // Carrega dados ao montar o componente
    useEffect(() => {
        buscaAlunos();
        buscaTurmas();
    }, []);

    // Recarrega quando filtros, paginação ou ordenação mudam
    useEffect(() => {
        if (!loading) {
            buscaAlunos();
        }
    }, [filtros.status, filtros.turmaId, filtros.busca, paginacao.paginaAtual, ordenacao.campo, ordenacao.ordem]);

    // Formata data de YYYY-MM-DD para DD/MM/YYYY
    const formataData = (data) => {
        if (!data) return '-';
        const dataFormat = new Date(data);
        const dia = String(dataFormat.getDate()).padStart(2, '0');
        const mes = String(dataFormat.getMonth() + 1).padStart(2, '0');
        const ano = dataFormat.getFullYear();
        return `${dia}/${mes}/${ano}`;
    };

    // Mostra mensagem temporária
    const mostraMensagem = (tipo, texto) => {
        setMensagem({ tipo, texto });
        setTimeout(() => setMensagem({ tipo: '', texto: '' }), 4000);
    };

    // Abre modal de status
    const abreModalStatus = (aluno) => {
        setModalStatus({
            aberto: true,
            alunoId: aluno.id,
            alunoNome: aluno.nome,
            statusAtual: aluno.ativo,
        });
    };

    // Fecha modal de status
    const fechaModalStatus = () => {
        setModalStatus({
            aberto: false,
            alunoId: null,
            alunoNome: '',
            statusAtual: false,
        });
    };

    // Confirma alteração de status
    const confirmaAlteracaoStatus = async () => {
        const { alunoId, statusAtual } = modalStatus;
        const acao = statusAtual ? 'inativar' : 'reativar';

        try {
            await api.put(`/alunos/${alunoId}/${acao}`);
            mostraMensagem('sucesso', `Aluno ${acao === 'inativar' ? 'inativado' : 'reativado'}`);
            fechaModalStatus();
            buscaAlunos();
        } catch (error) {
            console.error(`Erro ao ${acao} aluno:`, error);
            mostraMensagem('erro', error.response?.data?.mensagem || `Erro ao ${acao} aluno.`);

            fechaModalStatus();
        }
    };

    // Abre modal de confirmação de exclusão
    const abreModalExcluir = (aluno) => {
        setModalExcluir({
            aberto: true,
            alunoId: aluno.id,
            alunoNome: aluno.nome,
        });
    };

    // Fecha modal de exclusão
    const fechaModalExcluir = () => {
        setModalExcluir({
            aberto: false,
            alunoId: null,
            alunoNome: '',
        });
    };

    // Confirma e exclui aluno
    const confirmaExclusao = async () => {
        try {
            await api.delete(`/alunos/${modalExcluir.alunoId}`);
            mostraMensagem('sucesso', 'Aluno excluído');
            fechaModalExcluir();
            buscaAlunos();
        } catch (error) {
            console.error('Erro ao excluir aluno:', error);
            mostraMensagem('erro', error.response?.data?.mensagem || 'Erro ao excluir aluno.');
            fechaModalExcluir();
        }
    };

    // Abre modal de filtros
    const abreModalFiltros = () => {
        setFiltrosTemp(filtros);
        setModalFiltros(true);
    };

    // Fecha modal de filtros sem aplicar filtros
    const fechaModalFiltros = () => {
        setModalFiltros(false);
    };

    // Aplica filtros do modal
    const aplicaFiltros = () => {
        setFiltros(filtrosTemp);
        setPaginacao((prev) => ({ ...prev, paginaAtual: 1 }));
        setModalFiltros(false);
    };

    // Limpa filtros
    const limpaFiltros = () => {
        const filtrosPadrao = {
            status: 'todos',
            turmaId: 'todas',
            busca: '',
        };
        setFiltros(filtrosPadrao);
        setPaginacao((prev) => ({ ...prev, paginaAtual: 1 }));
        setModalFiltros(false);
    };

    // Atualiza filtro temporário
    const atualizaFiltroTemp = (campo, valor) => {
        setFiltrosTemp((prev) => ({ ...prev, [campo]: valor }));
    };

    // Atualiza filtros
    const atualizaFiltro = (campo, valor) => {
        setFiltros((prev) => ({ ...prev, [campo]: valor }));
        // Volta para primeira página ao filtrar
        setPaginacao((prev) => ({ ...prev, paginaAtual: 1 }));
    };

    // Muda ordenação ao clicar no header da coluna
    const mudaOrdenacao = (campo) => {
        setOrdenacao((prev) => ({
            campo,
            ordem: prev.campo === campo && prev.ordem === 'asc' ? 'desc' : 'asc',
        }));
        // Volta para primeira página ao ordenar
        setPaginacao((prev) => ({ ...prev, paginaAtual: 1 }));
    };

    // Navega entre páginas
    const mudaPagina = (novaPagina) => {
        if (novaPagina >= 1 && novaPagina <= paginacao.totalPaginas) {
            setPaginacao((prev) => ({ ...prev, paginaAtual: novaPagina }));
        }
    };

    // Seta de ordenação
    const setaOrdenacao = (campo) => {
        if (ordenacao.campo !== campo) {
            return <span className="sort-arrow">⇅</span>;
        }
        return ordenacao.ordem === 'asc' ? (
            <span className="sort-arrow active">⬆</span>
        ) : (
            <span className="sort-arrow active">⬇</span>
        );
    };

    return (
        <div className="content">
            {/* Header */}
            <div className="content-header">
                <h1 className="content-title">Alunos</h1>
                {admin && (
                    <button onClick={() => navigate('/alunos/cadastro')} className="btn btn-primary">
                        + Novo Aluno
                    </button>
                )}
            </div>

            {/* Botão de Filtros Nobile */}
            <button onClick={abreModalFiltros} className="btn-open-filters">
                🔍 Filtros
            </button>

            {/* Mensagem de Feedback */}
            {mensagem.texto && <div className={`alert alert-${mensagem.tipo}`}>{mensagem.texto}</div>}

            {/* Filtros */}
            <div className="content-filters">
                <div className="content-filters-group">
                    <div className="input-group">
                        <label className="input-label">Buscar</label>
                        <input
                            type="text"
                            placeholder="Buscar por nome..."
                            value={filtros.busca}
                            onChange={(e) => atualizaFiltro('busca', e.target.value)}
                            className="input-field"
                        />
                    </div>

                    <div className="input-group">
                        <label className="input-label">Status</label>
                        <select
                            value={filtros.status}
                            onChange={(e) => atualizaFiltro('status', e.target.value)}
                            className={`input-select ${filtros.status === 'todos' ? 'placeholder-active' : ''}`}
                        >
                            <option value="todos">Todos os Status</option>
                            <option value="ativo">Ativo</option>
                            <option value="inativo">Inativo</option>
                        </select>
                    </div>

                    <div className="input-group">
                        <label className="input-label">Turma</label>
                        <select
                            value={filtros.turmaId}
                            onChange={(e) => atualizaFiltro('turmaId', e.target.value)}
                            className={`input-select ${filtros.turmaId === 'todas' ? 'placeholder-active' : ''}`}
                        >
                            <option value="todas">Todas as Turmas</option>
                            {turmas.map((turma) => (
                                <option key={turma.id} value={turma.id}>
                                    {turma.nomeCompleto}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Loading */}
            {loading && (
                <div className="loading">
                    <div className="spinner-loading"></div>
                    <p>Carregando alunos...</p>
                </div>
            )}

            {/* Erro */}
            {erro && !loading && (
                <div className="error">
                    <p>⚠️ {erro}</p>
                    <button onClick={buscaAlunos} className="btn btn-primary" /*style={{ marginTop: '15px' }}*/>
                        Tentar Novamente
                    </button>
                </div>
            )}

            {/* Conteúdo */}
            {!loading && !erro && (
                <>
                    {alunos.length === 0 ? (
                        <div className="empty">
                            <p> Nenhum aluno encontrado. </p>
                            {admin && (
                                <button onClick={() => navigate('/alunos/cadastro')} className="btn btn-primary">
                                    Cadastrar Aluno
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="table-container">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th className="sort-header" onClick={() => mudaOrdenacao('ativo')}>
                                                Status
                                                {setaOrdenacao('ativo')}
                                            </th>
                                            <th className="sort-header" onClick={() => mudaOrdenacao('matricula')}>
                                                Matrícula
                                                {setaOrdenacao('matricula')}
                                            </th>
                                            <th className="sort-header" onClick={() => mudaOrdenacao('nome')}>
                                                Nome
                                                {setaOrdenacao('nome')}
                                            </th>
                                            <th className="sort-header" onClick={() => mudaOrdenacao('dataNascimento')}>
                                                Data de Nascimento
                                                {setaOrdenacao('dataNascimento')}
                                            </th>
                                            <th className="sort-header" onClick={() => mudaOrdenacao('email')}>
                                                Email
                                                {setaOrdenacao('email')}
                                            </th>
                                            <th className="sort-header" onClick={() => mudaOrdenacao('turmaId')}>
                                                Turma
                                                {setaOrdenacao('turmaId')}
                                            </th>
                                            <th>Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {alunos.map((aluno) => (
                                            <tr key={aluno.id}>
                                                <td data-label="Status">
                                                    <span
                                                        className={`badge ${aluno.ativo ? 'badge-verde' : 'badge-vermelha'}`}
                                                    >
                                                        {aluno.ativo ? 'Ativo' : 'Inativo'}
                                                    </span>
                                                </td>
                                                <td data-label="Matricula"> {aluno.matricula} </td>
                                                <td data-label="Nome" style={{ fontWeight: '600' }}>
                                                    {aluno.nome}
                                                </td>
                                                <td data-label="Data Nasc">{formataData(aluno.dataNascimento)}</td>
                                                <td data-label="Email">{aluno.email || '-'}</td>
                                                <td data-label="Turma">{aluno.turma?.nomeCompleto || '-'}</td>
                                                <td data-label="Ações">
                                                    <div className="table-action">
                                                        <button
                                                            onClick={() => navigate(`/alunos/editar/${aluno.id}`)}
                                                            className="btn-action"
                                                            title="Editar aluno"
                                                        >
                                                            ✏️
                                                        </button>

                                                        <div className="switch-container">
                                                            <label
                                                                className="switch"
                                                                title={aluno.ativo ? 'Inativar aluno' : 'Retivar aluno'}
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={aluno.ativo}
                                                                    onChange={() => abreModalStatus(aluno)}
                                                                />
                                                                <span className="slider"></span>
                                                            </label>
                                                        </div>

                                                        <button
                                                            onClick={() => abreModalExcluir(aluno)}
                                                            className="btn-action"
                                                            title="Excluir aluno"
                                                        >
                                                            🗑️
                                                        </button>
                                                    </div>

                                                    {/* Botões Mobile */}
                                                    <div className="table-action table-action-mobile">
                                                        <button
                                                            onClick={() => navigate(`/alunos/editar/${alunos.id}`)}
                                                            className="btn-mobile btn-mobile-edit"
                                                        >
                                                            Editar
                                                        </button>

                                                        <button
                                                            onClick={() => abreModalStatus(aluno)}
                                                            className={`btn-mobile btn-mobile-toggle ${aluno.ativo ? 'inactive' : ''}`}
                                                        >
                                                            {aluno.ativo ? 'Inativar' : 'Reativar'}
                                                        </button>

                                                        <button
                                                            onClick={() => abreModalExcluir(aluno)}
                                                            className="btn-mobile btn-mobile-delete"
                                                        >
                                                            Excluir
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
                                        Mostrando{' '}
                                        {paginacao.totalItens === 0
                                            ? 0
                                            : (paginacao.paginaAtual - 1) * paginacao.itensPorPagina + 1}
                                        {' a '}
                                        {Math.min(
                                            paginacao.paginaAtual * paginacao.itensPorPagina,
                                            paginacao.totalItens,
                                        )}
                                        {' de '}
                                        {paginacao.totalItens} aluno(s)
                                    </p>
                                </div>

                                {paginacao.totalPaginas > 1 && (
                                    <div className="page-controller">
                                        <button
                                            onClick={() => mudaPagina(1)}
                                            disabled={paginacao.paginaAtual === 1}
                                            className="page-btn"
                                            title="Primeira página"
                                        >
                                            «
                                        </button>

                                        <button
                                            onClick={() => mudaPagina(paginacao.paginaAtual - 1)}
                                            disabled={paginacao.paginaAtual === 1}
                                            className="page-btn"
                                            title="Página anterior"
                                        >
                                            ‹
                                        </button>

                                        <div className="page-number">
                                            {paginacao.paginaAtual > 2 && (
                                                <>
                                                    <button onClick={() => mudaPagina(1)} className="page-btn">
                                                        1
                                                    </button>
                                                    {paginacao.paginaAtual > 3 && (
                                                        <span className="page-others">...</span>
                                                    )}
                                                </>
                                            )}

                                            {paginacao.paginaAtual > 1 && (
                                                <button
                                                    onClick={() => mudaPagina(paginacao.paginaAtual - 1)}
                                                    className="page-btn"
                                                >
                                                    {paginacao.paginaAtual - 1}
                                                </button>
                                            )}

                                            <button className="page-btn active">{paginacao.paginaAtual}</button>

                                            {paginacao.paginaAtual < paginacao.totalPaginas && (
                                                <button
                                                    onClick={() => mudaPagina(paginacao.paginaAtual + 1)}
                                                    className="page-btn"
                                                >
                                                    {paginacao.paginaAtual + 1}
                                                </button>
                                            )}

                                            {paginacao.paginaAtual < paginacao.totalPaginas - 1 && (
                                                <>
                                                    {paginacao.paginaAtual < paginacao.totalPaginas - 2 && (
                                                        <span className="page-others">...</span>
                                                    )}
                                                    <button
                                                        onClick={() => mudaPagina(paginacao.totalPaginas)}
                                                        className="page-btn"
                                                    >
                                                        {paginacao.totalPaginas}
                                                    </button>
                                                </>
                                            )}
                                        </div>

                                        <button
                                            onClick={() => mudaPagina(paginacao.paginaAtual + 1)}
                                            disabled={paginacao.paginaAtual === paginacao.totalPaginas}
                                            className="page-btn"
                                            title="Próxima página"
                                        >
                                            ›
                                        </button>

                                        <button
                                            onClick={() => mudaPagina(paginacao.totalPaginas)}
                                            disabled={paginacao.paginaAtual === paginacao.totalPaginas}
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
                </>
            )}

            {/* Modal de Filtros Mobile */}
            {modalFiltros && (
                <div className="filters-modal-overlay" onClick={fechaModalFiltros}>
                    <div className="filters-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="filters-modal-header">
                            <h3 className="filters-modal-title">Filtros</h3>
                            <button onClick={fechaModalFiltros} className="btn-close-filters">
                                ×
                            </button>
                        </div>

                        <div className="input-group">
                            <label className="input-label">Buscar</label>
                            <input
                                type="text"
                                placeholder="Buscar por nome..."
                                value={filtrosTemp.busca}
                                onChange={(e) => atualizaFiltroTemp('busca', e.target.value)}
                                className="input-field"
                            />
                        </div>

                        <div className="input-group">
                            <label className="input-label">Status</label>
                            <select
                                value={filtrosTemp.status}
                                onChange={(e) => atualizaFiltroTemp('status', e.target.value)}
                                className="input-select"
                            >
                                <option value="todos">Todos os Status</option>
                                <option value="ativo">Ativo</option>
                                <option value="inativo">Inativo</option>
                            </select>
                        </div>

                        <div className="input-group">
                            <label className="input-label">Turma</label>
                            <select
                                value={filtrosTemp.turmaId}
                                onChange={(e) => atualizaFiltroTemp('turmaId', e.target.value)}
                                className="input-select"
                            >
                                <option value="todas">Todas as Turmas</option>
                                {turmas.map((turma) => (
                                    <option key={turma.id} value={turma.id}>
                                        {turma.nomeCompleto}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="filters-modal-actions">
                            <button onClick={limpaFiltros} className="btn-clear-filters">
                                Limpar
                            </button>
                            <button onClick={aplicaFiltros} className="btn-apply-filters">
                                Aplicar Filtros
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Confirmação de Status */}
            {modalStatus.aberto && (
                <div className="modal-overlay" onClick={fechaModalStatus}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>{modalStatus.statusAtual ? '⚠️ Inativar Aluno' : '✅ Reativar Aluno'}</h2>
                        <p>
                            Deseja realmente {modalStatus.statusAtual ? 'inativar' : 'reativar'} o aluno{' '}
                            <strong>{modalStatus.alunoNome}</strong>?
                        </p>
                        {modalStatus.statusAtual && (
                            <p className="modal-warning">
                                O aluno ficará inativo e poderá não aparecer em algumas listagens.
                            </p>
                        )}
                        <div className="modal-action">
                            <button onClick={fechaModalStatus} className="btn btn-secondary">
                                Cancelar
                            </button>
                            <button
                                onClick={confirmaAlteracaoStatus}
                                className={`btn ${modalStatus.statusAtual ? 'btn-danger' : 'btn-success'}`}
                            >
                                {modalStatus.statusAtual ? 'Inativar' : 'Reativar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Confirmação de Exclusão */}
            {modalExcluir.aberto && (
                <div className="modal-overlay" onClick={fechaModalExcluir}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>⚠️ Confirmar Exclusão</h2>
                        <p>
                            Deseja realmente excluir o aluno <strong>{modalExcluir.alunoNome}</strong>?
                        </p>
                        <p className="modal-warning">Esta ação não poderá ser desfeita!</p>
                        <div className="modal-action">
                            <button onClick={fechaModalExcluir} className="btn btn-secondary">
                                Cancelar
                            </button>
                            <button onClick={confirmaExclusao} className="btn btn-danger">
                                Excluir
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ListaAlunos;
