import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const ListaTurmas = () => {
    const navigate = useNavigate();

    // Estados
    const [turmas, setTurmas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState(null);
    const [filtros, setFiltros] = useState({
        status: 'todos',
        etapa: 'todas',
        periodo: 'todos',
        semAlunos: false,
        busca: '',
    });
    const [paginacao, setPaginacao] = useState({
        paginaAtual: 1,
        itensPorPagina: 10,
        totalItens: 0,
        totalPaginas: 0,
    });
    const [ordenacao, setOrdenacao] = useState({
        campo: 'anoSerie',
        ordem: 'asc',
    });
    const [modalExcluir, setModalExcluir] = useState({
        aberto: false,
        turmaId: null,
        turmaNome: '',
    });
    const [modalStatus, setModalStatus] = useState({
        aberto: false,
        turmaId: null,
        turmaNome: '',
        statusAtual: false,
    });

    const [modalFiltros, setModalFiltros] = useState(false);
    const [filtrosTemp, setFiltrosTemp] = useState({
        status: 'todos',
        etapa: 'todas',
        periodo: 'todos',
        semAlunos: false,
        busca: '',
    });
    const [mensagem, setMensagem] = useState({
        tipo: '',
        texto: '',
    });

    // Carrega turmas
    const carregaTurmas = async () => {
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
            if (filtros.etapa !== 'todas') {
                params.etapa = filtros.etapa;
            }
            if (filtros.periodo !== 'todos') {
                params.periodo = filtros.periodo;
            }
            if (filtros.semAlunos) {
                params.semAlunos = 'true';
            }
            if (filtros.busca.trim()) {
                params.nome = filtros.busca.trim();
            }

            const response = await api.get('/turmas', { params });

            const dados = response.data.dados || response.data;
            setTurmas(dados.turmas || dados || []);

            // Atualiza informações de paginação
            if (dados.paginacao) {
                setPaginacao((prev) => ({
                    ...prev,
                    totalItens: dados.paginacao.total,
                    totalPaginas: dados.paginacao.totalPaginas,
                }));
            }
        } catch (error) {
            console.error('Erro ao buscar turmas:', error);
            setErro(error.response?.data?.mensagem || 'Erro ao carregar turmas. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    // Carrega dados ao montar o componente
    useEffect(() => {
        carregaTurmas();
    }, []);

    // Recarrega quando filtros, paginação ou ordenação mudam
    useEffect(() => {
        if (!loading) {
            carregaTurmas();
        }
    }, [
        filtros.status,
        filtros.etapa,
        filtros.periodo,
        filtros.busca,
        filtros.semAlunos,
        paginacao.paginaAtual,
        ordenacao.campo,
        ordenacao.ordem,
    ]);

    // Mostra mensagem temporária
    const mostraMensagem = (tipo, texto) => {
        setMensagem({ tipo, texto });
        setTimeout(() => setMensagem({ tipo: '', texto: '' }), 4000);
    };

    // Formata período para exibição
    const formataPeriodo = (periodo) => {
        const periodos = {
            MATUTINO: 'Matutino',
            VESPERTINO: 'Vespertino',
            NOTURNO: 'Noturno',
        };
        return periodos[periodo] || periodo;
    };

    // Formata etapa para exibição
    const formataEtapa = (etapa) => {
        const etapas = {
            'Ensino Fundamental Anos Iniciais': 'Ensino Fundamental Anos Iniciais',
            'Ensino Fundamental Anos Finais': 'Ensino Fundamental Anos Finais',
            'Ensino Médio': 'Ensino Médio',
        };
        return etapas[etapa] || etapa;
    };

    // Abre modal de status
    const abreModalStatus = (turma) => {
        setModalStatus({
            aberto: true,
            turmaId: turma.id,
            turmaNome: turma.nomeCompleto,
            statusAtual: turma.ativo,
        });
    };

    // Fecha modal de status
    const fechaModalStatus = () => {
        setModalStatus({
            aberto: false,
            turmaId: null,
            turmaNome: '',
            statusAtual: false,
        });
    };

    // Confirma alteração de status
    const confirmaAlteracaoStatus = async () => {
        const { turmaId, statusAtual } = modalStatus;
        const acao = statusAtual ? 'inativar' : 'reativar';

        try {
            await api.put(`/turmas/${turmaId}/${acao}`);
            mostraMensagem('sucesso', `Turma ${acao === 'inativar' ? 'inativada' : 'reativada'}`);
            fechaModalStatus();
            carregaTurmas();
        } catch (error) {
            console.error(`Erro ao ${acao} turma:`, error);
            mostraMensagem('erro', error.response?.data?.mensagem || `Erro ao ${acao} turma.`);

            fechaModalStatus();
        }
    };

    // Abre modal de confirmação de exclusão
    const abreModalExcluir = (turma) => {
        setModalExcluir({
            aberto: true,
            turmaId: turma.id,
            turmaNome: turma.nomeCompleto,
        });
    };

    // Fecha modal de exclusão
    const fechaModalExcluir = () => {
        setModalExcluir({
            aberto: false,
            turmaId: null,
            turmaNome: '',
        });
    };

    // Confirma e exclui turma
    const confirmaExclusao = async () => {
        try {
            await api.delete(`/turmas/${modalExcluir.turmaId}`);
            mostraMensagem('sucesso', 'Turma excluída com sucesso');
            fechaModalExcluir();
            carregaTurmas();
        } catch (error) {
            console.error('Erro ao excluir turma:', error);
            mostraMensagem('erro', error.response?.data?.mensagem || 'Erro ao excluir turma.');
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
            etapa: 'todas',
            periodo: 'todos',
            semAlunos: false,
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
                <h1 className="content-title">Turmas</h1>
                <button onClick={() => navigate('/turmas/cadastro')} className="btn btn-primary">
                    + Nova Turma
                </button>
            </div>

            {/* Botão de Filtros Mobile */}
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
                        <label className="input-label">Etapa</label>
                        <select
                            value={filtros.etapa}
                            onChange={(e) => atualizaFiltro('etapa', e.target.value)}
                            className={`input-select ${filtros.etapa === 'todas' ? 'placeholder-active' : ''}`}
                        >
                            <option value="todas">Todas as Etapas</option>
                            <option value="Ensino Fundamental Anos Iniciais">Ensino Fundamental Anos Iniciais</option>
                            <option value="Ensino Fundamental Anos Finais">Ensino Fundamental Anos Finais</option>
                            <option value="Ensino Médio">Ensino Médio</option>
                        </select>
                    </div>

                    <div className="input-group">
                        <label className="input-label">Período</label>
                        <select
                            value={filtros.periodo}
                            onChange={(e) => atualizaFiltro('periodo', e.target.value)}
                            className={`input-select ${filtros.periodo === 'todos' ? 'placeholder-active' : ''}`}
                        >
                            <option value="todos">Todos os Períodos</option>
                            <option value="MATUTINO">Matutino</option>
                            <option value="VESPERTINO">Vespertino</option>
                            <option value="NOTURNO">Noturno</option>
                        </select>
                    </div>

                    <div className="input-group">
                        <label className="input-label">Alunos</label>
                        <select
                            value={filtros.semAlunos ? 'sem-alunos' : 'todos'}
                            onChange={(e) => atualizaFiltro('semAlunos', e.target.value === 'sem-alunos')}
                            className={`input-select ${filtros.semAlunos ? '' : 'placeholder-active'}`}
                        >
                            <option value="todos">Todos</option>
                            <option value="sem-alunos">Sem Alunos</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Loading */}
            {loading && (
                <div className="loading">
                    <div className="spinner-loading"></div>
                    <p>Carregando turmas...</p>
                </div>
            )}

            {/* Erro */}
            {erro && !loading && (
                <div className="error">
                    <p>⚠️ {erro}</p>
                    <button onClick={carregaTurmas} className="btn btn-primary">
                        Tentar Novamente
                    </button>
                </div>
            )}

            {/* Conteúdo */}
            {!loading && !erro && (
                <>
                    {turmas.length === 0 ? (
                        <div className="empty">
                            <p> Nenhuma turma encontrada </p>
                        </div>
                    ) : (
                        <>
                            <div className="table-container">
                                <table className="table table-turmas">
                                    <thead>
                                        <tr>
                                            <th className="sort-header" onClick={() => mudaOrdenacao('ativo')}>
                                                Status
                                                {setaOrdenacao('ativo')}
                                            </th>
                                            <th className="sort-header" onClick={() => mudaOrdenacao('nomeCompleto')}>
                                                Nome
                                                {setaOrdenacao('nomeCompleto')}
                                            </th>
                                            <th className="sort-header" onClick={() => mudaOrdenacao('anoSerie')}>
                                                Etapa
                                                {setaOrdenacao('anoSerie')}
                                            </th>
                                            <th className="sort-header" onClick={() => mudaOrdenacao('anoLetivo')}>
                                                Ano Letivo
                                                {setaOrdenacao('anoLetivo')}
                                            </th>
                                            <th className="sort-header" onClick={() => mudaOrdenacao('periodo')}>
                                                Período
                                                {setaOrdenacao('periodo')}
                                            </th>
                                            <th>Ativos</th>
                                            <th>Inativos</th>
                                            <th>Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {turmas.map((turma) => (
                                            <tr key={turma.id}>
                                                <td data-label="Status">
                                                    <span
                                                        className={`badge ${turma.ativo ? 'badge-verde' : 'badge-vermelha'}`}
                                                    >
                                                        {turma.ativo ? 'Ativo' : 'Inativo'}
                                                    </span>
                                                </td>
                                                <td data-label="Nome" style={{ fontWeight: '600' }}>
                                                    {turma.nomeCompleto}
                                                </td>
                                                <td data-label="Etapa">{formataEtapa(turma.anoSerie?.etapa) || '-'}</td>
                                                <td data-label="Ano Letivo">{turma.anoLetivo}</td>
                                                <td data-label="Período">{formataPeriodo(turma.periodo)}</td>
                                                <td data-label="Ativos">
                                                    {turma.alunos?.filter((a) => a.ativo).length ?? 0}
                                                </td>
                                                <td data-label="Inativos">
                                                    {turma.alunos?.filter((a) => !a.ativo).length ?? 0}
                                                </td>
                                                <td data-label="Ações">
                                                    <div className="table-action">
                                                        <button
                                                            onClick={() => navigate(`/turmas/${turma.id}/detalhes`)}
                                                            className="btn-action"
                                                            title="Ver detalhes"
                                                        >
                                                            👁️
                                                        </button>
                                                        <button
                                                            onClick={() => navigate(`/turmas/${turma.id}`)}
                                                            className="btn-action"
                                                            title="Editar turma"
                                                        >
                                                            ✏️
                                                        </button>

                                                        <div className="switch-container">
                                                            <label
                                                                className="switch"
                                                                title={
                                                                    turma.ativo ? 'Inativar turma' : 'Reativar turma'
                                                                }
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={turma.ativo}
                                                                    onChange={() => abreModalStatus(turma)}
                                                                />
                                                                <span className="slider"></span>
                                                            </label>
                                                        </div>

                                                        <button
                                                            onClick={() => abreModalExcluir(turma)}
                                                            className="btn-action"
                                                            title="Excluir turma"
                                                        >
                                                            🗑️
                                                        </button>
                                                    </div>

                                                    {/* Botões Mobile */}
                                                    <div className="table-action table-action-mobile">
                                                        <button
                                                            onClick={() => navigate(`/turmas/${turma.id}/detalhes`)}
                                                            className="btn-mobile btn-mobile-edit"
                                                        >
                                                            Detalhes
                                                        </button>
                                                        <button
                                                            onClick={() => navigate(`/turmas/${turma.id}`)}
                                                            className="btn-mobile btn-mobile-edit"
                                                        >
                                                            Editar
                                                        </button>

                                                        <button
                                                            onClick={() => abreModalStatus(turma)}
                                                            className={`btn-mobile btn-mobile-toggle ${turma.ativo ? 'inactive' : ''}`}
                                                        >
                                                            {turma.ativo ? 'Inativar' : 'Reativar'}
                                                        </button>

                                                        <button
                                                            onClick={() => abreModalExcluir(turma)}
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
                                        {paginacao.totalItens} turma(s)
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
                            <label className="input-label">Etapa</label>
                            <select
                                value={filtrosTemp.etapa}
                                onChange={(e) => atualizaFiltroTemp('etapa', e.target.value)}
                                className="input-select"
                            >
                                <option value="todas">Todas as Etapas</option>
                                <option value="Ensino Fundamental Anos Iniciais">
                                    Ensino Fundamental Anos Iniciais
                                </option>
                                <option value="Ensino Fundamental Anos Finais">Ensino Fundamental Anos Finais</option>
                                <option value="Ensino Médio">Ensino Médio</option>
                            </select>
                        </div>

                        <div className="input-group">
                            <label className="input-label">Período</label>
                            <select
                                value={filtrosTemp.periodo}
                                onChange={(e) => atualizaFiltroTemp('periodo', e.target.value)}
                                className="input-select"
                            >
                                <option value="todos">Todos os Períodos</option>
                                <option value="MATUTINO">Matutino</option>
                                <option value="VESPERTINO">Vespertino</option>
                                <option value="NOTURNO">Noturno</option>
                            </select>
                        </div>

                        <div className="input-group">
                            <label className="input-label">Alunos</label>
                            <select
                                value={filtrosTemp.semAlunos ? 'sem-alunos' : 'todos'}
                                onChange={(e) => atualizaFiltroTemp('semAlunos', e.target.value === 'sem-alunos')}
                                className={`input-select ${filtrosTemp.semAlunos ? '' : 'placeholder-active'}`}
                            >
                                <option value="todos">Todos</option>
                                <option value="sem-alunos">Sem Alunos</option>
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
                        <h2>{modalStatus.statusAtual ? '⚠️ Inativar Turma' : '✅ Reativar Turma'}</h2>
                        <p>
                            Deseja realmente {modalStatus.statusAtual ? 'inativar' : 'reativar'} a turma{' '}
                            <strong>{modalStatus.turmaNome}</strong>?
                        </p>
                        {modalStatus.statusAtual && (
                            <p className="modal-warning">A turma ficará inativa e não poderá receber novos alunos.</p>
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
                            Deseja realmente excluir a turma <strong>{modalExcluir.turmaNome}</strong>?
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

export default ListaTurmas;
