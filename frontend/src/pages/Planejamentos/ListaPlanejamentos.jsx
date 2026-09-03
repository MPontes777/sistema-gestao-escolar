import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getUser } from '../../services/api';

const ListaPlanejamentos = () => {
    const navigate = useNavigate();
    const usuario = getUser();

    // Estados
    const [planejamentos, setPlanejamentos] = useState([]);
    const [vinculos, setVinculos] = useState({ turmas: [], disciplinas: [], vinculos: [] });
    const [loading, setLoading] = useState(true);
    const [loadingVinculos, setLoadingVinculos] = useState(true);
    const [erro, setErro] = useState(null);
    const [tituloInput, setTituloInput] = useState('');

    const [filtros, setFiltros] = useState({
        turmaId: '',
        disciplinaId: '',
        titulo: '',
        bimestre: '',
        dataInicio: '',
        dataFim: '',
    });

    // Filtros temporários
    const [filtrosTemp, setFiltrosTemp] = useState({
        turmaId: '',
        disciplinaId: '',
        titulo: '',
        bimestre: '',
        dataInicio: '',
        dataFim: '',
    });

    const [paginacao, setPaginacao] = useState({
        paginaAtual: 1,
        itensPorPagina: 10,
        totalItens: 0,
        totalPaginas: 0,
    });

    const [ordenacao, setOrdenacao] = useState({
        campo: 'data',
        ordem: 'desc',
    });

    const [modalFiltros, setModalFiltros] = useState(false);

    const [modalExcluir, setModalExcluir] = useState({
        aberto: false,
        id: null,
        titulo: '',
    });

    const [modalVisualizar, setModalVisualizar] = useState({
        aberto: false,
        planejamento: null,
    });

    const [mensagem, setMensagem] = useState({
        tipo: '',
        texto: '',
    });

    // Carrega vínculos
    const carregaVinculos = async () => {
        try {
            setLoadingVinculos(true);
            const response = await api.get('/planejamentos/vinculos');
            setVinculos(response.data.dados);
        } catch (error) {
            console.error('Erro ao buscar vínculos:', error);
            setErro('Erro ao carregar turmas/disciplinas disponíveis.');
        } finally {
            setLoadingVinculos(false);
        }
    };

    useEffect(() => {
        carregaVinculos();
    }, []);

    // Turmas vinculadas a uma disciplina
    const filtraTurmas = (disciplinaId) => {
        if (!disciplinaId) return vinculos.turmas;
        const idsValidos = new Set(
            vinculos.vinculos.filter((v) => v.disciplinaId === disciplinaId).map((v) => v.turmaId),
        );
        return vinculos.turmas.filter((t) => idsValidos.has(t.id));
    };

    // Disciplinas vinculadas a uma turma
    const filtraDisciplinas = (turmaId) => {
        if (!turmaId) return vinculos.disciplinas;
        const idsValidos = new Set(vinculos.vinculos.filter((v) => v.turmaId === turmaId).map((v) => v.disciplinaId));
        return vinculos.disciplinas.filter((d) => idsValidos.has(d.id));
    };

    // Cascata da versão desktop
    const turmasDisponiveis = useMemo(() => filtraTurmas(filtros.disciplinaId), [vinculos, filtros.disciplinaId]);
    const disciplinasDisponiveis = useMemo(() => filtraDisciplinas(filtros.turmaId), [vinculos, filtros.turmaId]);

    // Cascata da versão mobile
    const turmasDisponiveisTemp = useMemo(
        () => filtraTurmas(filtrosTemp.disciplinaId),
        [vinculos, filtrosTemp.disciplinaId],
    );
    const disciplinasDisponiveisTemp = useMemo(
        () => filtraDisciplinas(filtrosTemp.turmaId),
        [vinculos, filtrosTemp.turmaId],
    );

    // Atualiza filtro
    const atualizaFiltro = (campo, valor) => {
        setFiltros((prev) => {
            const novo = { ...prev, [campo]: valor };

            if (campo === 'turmaId' && prev.disciplinaId) {
                const aindaValido = vinculos.vinculos.some(
                    (v) => v.turmaId === valor && v.disciplinaId === prev.disciplinaId,
                );
                if (!aindaValido) novo.disciplinaId = '';
            }

            if (campo === 'disciplinaId' && prev.turmaId) {
                const aindaValido = vinculos.vinculos.some(
                    (v) => v.disciplinaId === valor && v.turmaId === prev.turmaId,
                );
                if (!aindaValido) novo.turmaId = '';
            }

            return novo;
        });
        setPaginacao((prev) => ({ ...prev, paginaAtual: 1 }));
    };

    // Atualiza filtro temporário do modal mobile
    const atualizaFiltroTemp = (campo, valor) => {
        setFiltrosTemp((prev) => {
            const novo = { ...prev, [campo]: valor };

            if (campo === 'turmaId' && prev.disciplinaId) {
                const aindaValido = vinculos.vinculos.some(
                    (v) => v.turmaId === valor && v.disciplinaId === prev.disciplinaId,
                );
                if (!aindaValido) novo.disciplinaId = '';
            }

            if (campo === 'disciplinaId' && prev.turmaId) {
                const aindaValido = vinculos.vinculos.some(
                    (v) => v.disciplinaId === valor && v.turmaId === prev.turmaId,
                );
                if (!aindaValido) novo.turmaId = '';
            }

            return novo;
        });
    };

    // Abre modal de filtros
    const abreModalFiltros = () => {
        setFiltrosTemp(filtros);
        setModalFiltros(true);
    };

    // Fecha modal sem aplicar
    const fechaModalFiltros = () => {
        setModalFiltros(false);
    };

    // Aplica os filtros do modal de uma vez só
    const aplicaFiltros = () => {
        setFiltros(filtrosTemp);
        setTituloInput(filtrosTemp.titulo);
        setPaginacao((prev) => ({ ...prev, paginaAtual: 1 }));
        setModalFiltros(false);
    };

    // Limpa todos os filtros
    const limpaFiltros = () => {
        const filtrosPadrao = {
            turmaId: '',
            disciplinaId: '',
            titulo: '',
            bimestre: '',
            dataInicio: '',
            dataFim: '',
        };
        setFiltros(filtrosPadrao);
        setFiltrosTemp(filtrosPadrao);
        setTituloInput('');
        setPaginacao((prev) => ({ ...prev, paginaAtual: 1 }));
        setModalFiltros(false);
    };

    // Carrega planejamentos
    const carregaPlanejamentos = async () => {
        try {
            setLoading(true);
            setErro(null);

            const params = {
                ordenarPor: ordenacao.campo,
                ordem: ordenacao.ordem,
                limit: paginacao.itensPorPagina,
                offset: (paginacao.paginaAtual - 1) * paginacao.itensPorPagina,
            };

            if (filtros.turmaId) params.turmaId = filtros.turmaId;
            if (filtros.disciplinaId) params.disciplinaId = filtros.disciplinaId;
            if (filtros.titulo.trim()) params.titulo = filtros.titulo.trim();
            if (filtros.bimestre) params.bimestre = filtros.bimestre;
            if (filtros.dataInicio) params.dataInicio = filtros.dataInicio;
            if (filtros.dataFim) params.dataFim = filtros.dataFim;

            const response = await api.get('/planejamentos', { params });
            const dados = response.data.dados;

            setPlanejamentos(dados.planejamentos || []);
            setPaginacao((prev) => ({
                ...prev,
                totalItens: dados.paginacao.total,
                totalPaginas: dados.paginacao.totalPaginas,
            }));
        } catch (error) {
            console.error('Erro ao buscar planejamentos:', error);
            setErro(error.response?.data?.mensagem || 'Erro ao carregar planejamentos. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    // Atualiza o filtro de título um tempo depois que o usuário parar de digitar
    useEffect(() => {
        const timer = setTimeout(() => {
            setFiltros((prev) => ({ ...prev, titulo: tituloInput }));
            setPaginacao((prev) => ({ ...prev, paginaAtual: 1 }));
        }, 400);

        return () => clearTimeout(timer);
    }, [tituloInput]);

    // Recarrega quando filtros, paginação ou ordenação mudam
    useEffect(() => {
        if (!loadingVinculos) {
            carregaPlanejamentos();
        }
    }, [
        loadingVinculos,
        filtros.turmaId,
        filtros.disciplinaId,
        filtros.titulo,
        filtros.bimestre,
        filtros.dataInicio,
        filtros.dataFim,
        paginacao.paginaAtual,
        ordenacao.campo,
        ordenacao.ordem,
    ]);

    // Mostra mensagem temporária
    const mostraMensagem = (tipo, texto) => {
        setMensagem({ tipo, texto });
        setTimeout(() => setMensagem({ tipo: '', texto: '' }), 4000);
    };

    // Formata data para exibição
    const formataData = (data) => {
        if (!data) return '-';
        const d = new Date(data);
        const dia = String(d.getUTCDate()).padStart(2, '0');
        const mes = String(d.getUTCMonth() + 1).padStart(2, '0');
        const ano = d.getUTCFullYear();
        return `${dia}/${mes}/${ano}`;
    };

    // Muda ordenação
    const mudaOrdenacao = (campo) => {
        setOrdenacao((prev) => ({
            campo,
            ordem: prev.campo === campo && prev.ordem === 'asc' ? 'desc' : 'asc',
        }));
        setPaginacao((prev) => ({ ...prev, paginaAtual: 1 }));
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

    // Navega entre páginas
    const mudaPagina = (novaPagina) => {
        if (novaPagina >= 1 && novaPagina <= paginacao.totalPaginas) {
            setPaginacao((prev) => ({ ...prev, paginaAtual: novaPagina }));
        }
    };

    // Verifica se o usuário logado pode gerenciar um planejamento
    const podeGerenciar = (planejamento) => {
        return usuario?.perfil === 'professor' && planejamento.professorId === usuario.id;
    };

    // Abre modal de visualização
    const abreModalVisualizar = (planejamento) => {
        setModalVisualizar({ aberto: true, planejamento });
    };

    // Fecha modal de visualização
    const fechaModalVisualizar = () => {
        setModalVisualizar({ aberto: false, planejamento: null });
    };

    // Abre modal de exclusão
    const abreModalExcluir = (planejamento) => {
        setModalExcluir({
            aberto: true,
            id: planejamento.id,
            titulo: planejamento.titulo,
        });
    };

    // Fecha modal de exclusão
    const fechaModalExcluir = () => {
        setModalExcluir({ aberto: false, id: null, titulo: '' });
    };

    // Confirma e exclui planejamento
    const confirmaExclusao = async () => {
        try {
            await api.delete(`/planejamentos/${modalExcluir.id}`);
            mostraMensagem('sucesso', 'Planejamento excluído com sucesso');
            fechaModalExcluir();
            carregaPlanejamentos();
        } catch (error) {
            console.error('Erro ao excluir planejamento:', error);
            mostraMensagem('erro', error.response?.data?.mensagem || 'Erro ao excluir planejamento.');
            fechaModalExcluir();
        }
    };

    return (
        <div className="content">
            {/* Header */}
            <div className="content-header">
                <h1 className="content-title">Planejamentos</h1>
                {usuario?.perfil === 'professor' && (
                    <button onClick={() => navigate('/planejamentos/cadastro')} className="btn btn-primary">
                        + Novo Planejamento
                    </button>
                )}
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
                        <label className="input-label">Título</label>
                        <input
                            type="text"
                            placeholder="Buscar por título..."
                            value={tituloInput}
                            onChange={(e) => setTituloInput(e.target.value)}
                            className="input-field"
                        />
                    </div>

                    <div className="input-group">
                        <label className="input-label">Bimestre</label>
                        <select
                            value={filtros.bimestre}
                            onChange={(e) => atualizaFiltro('bimestre', e.target.value)}
                            className={`input-select ${filtros.bimestre === '' ? 'placeholder-active' : ''}`}
                        >
                            <option value="">Todos os Bimestres</option>
                            <option value="1">1º Bimestre</option>
                            <option value="2">2º Bimestre</option>
                            <option value="3">3º Bimestre</option>
                            <option value="4">4º Bimestre</option>
                        </select>
                    </div>

                    <div className="input-group">
                        <label className="input-label">Turma</label>
                        <select
                            value={filtros.turmaId}
                            onChange={(e) => atualizaFiltro('turmaId', e.target.value)}
                            className={`input-select ${filtros.turmaId === '' ? 'placeholder-active' : ''}`}
                            disabled={loadingVinculos}
                        >
                            <option value="">Todas as Turmas</option>
                            {turmasDisponiveis.map((t) => (
                                <option key={t.id} value={t.id}>
                                    {t.nomeCompleto}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="input-group">
                        <label className="input-label">Disciplina</label>
                        <select
                            value={filtros.disciplinaId}
                            onChange={(e) => atualizaFiltro('disciplinaId', e.target.value)}
                            className={`input-select ${filtros.disciplinaId === '' ? 'placeholder-active' : ''}`}
                            disabled={loadingVinculos}
                        >
                            <option value="">Todas as Disciplinas</option>
                            {disciplinasDisponiveis.map((d) => (
                                <option key={d.id} value={d.id}>
                                    {d.nome}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="input-group">
                        <label className="input-label">De</label>
                        <input
                            type="date"
                            value={filtros.dataInicio}
                            onChange={(e) => atualizaFiltro('dataInicio', e.target.value)}
                            className="input-field"
                        />
                    </div>

                    <div className="input-group">
                        <label className="input-label">Até</label>
                        <input
                            type="date"
                            value={filtros.dataFim}
                            onChange={(e) => atualizaFiltro('dataFim', e.target.value)}
                            className="input-field"
                        />
                    </div>
                </div>
            </div>

            {/* Loading */}
            {(loading || loadingVinculos) && (
                <div className="loading">
                    <div className="spinner-loading"></div>
                    <p>Carregando planejamentos...</p>
                </div>
            )}

            {/* Erro */}
            {erro && !loading && !loadingVinculos && (
                <div className="error">
                    <p>⚠️ {erro}</p>
                    <button onClick={carregaPlanejamentos} className="btn btn-primary">
                        Tentar Novamente
                    </button>
                </div>
            )}

            {/* Conteúdo */}
            {!loading && !loadingVinculos && !erro && (
                <>
                    {planejamentos.length === 0 ? (
                        <div className="empty">
                            <p>Nenhum planejamento encontrado</p>
                        </div>
                    ) : (
                        <>
                            <div className="table-container">
                                <table className="table table-planejamentos">
                                    <thead>
                                        <tr>
                                            <th className="sort-header" onClick={() => mudaOrdenacao('data')}>
                                                Data
                                                {setaOrdenacao('data')}
                                            </th>
                                            <th className="sort-header" onClick={() => mudaOrdenacao('titulo')}>
                                                Título
                                                {setaOrdenacao('titulo')}
                                            </th>
                                            <th className="sort-header" onClick={() => mudaOrdenacao('bimestre')}>
                                                Bimestre
                                                {setaOrdenacao('bimestre')}
                                            </th>
                                            <th className="sort-header" onClick={() => mudaOrdenacao('turma')}>
                                                Turma
                                                {setaOrdenacao('turma')}
                                            </th>
                                            <th className="sort-header" onClick={() => mudaOrdenacao('disciplina')}>
                                                Disciplina
                                                {setaOrdenacao('disciplina')}
                                            </th>
                                            <th className="sort-header" onClick={() => mudaOrdenacao('professor')}>
                                                Professor
                                                {setaOrdenacao('professor')}
                                            </th>
                                            <th>Aulas</th>
                                            <th>Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {planejamentos.map((p) => (
                                            <tr key={p.id}>
                                                <td data-label="Data">{formataData(p.data)}</td>
                                                <td data-label="Título" style={{ fontWeight: '600' }}>
                                                    {p.titulo}
                                                </td>
                                                <td data-label="Bimestre">{p.bimestre}º Bimestre</td>
                                                <td data-label="Turma">{p.turma?.nomeCompleto}</td>
                                                <td data-label="Disciplina">{p.disciplina?.nome}</td>
                                                <td data-label="Professor">{p.professor?.nome}</td>
                                                <td data-label="Aulas">{p.numeroAulas}</td>
                                                <td data-label="Ações">
                                                    {/* Botões Desktop */}
                                                    <div className="table-action">
                                                        <button
                                                            onClick={() => abreModalVisualizar(p)}
                                                            className="btn-action"
                                                            title="Ver detalhes"
                                                        >
                                                            👁️
                                                        </button>

                                                        {podeGerenciar(p) && (
                                                            <>
                                                                <button
                                                                    onClick={() =>
                                                                        navigate(`/planejamentos/faltas/${p.id}`)
                                                                    }
                                                                    className="btn-action"
                                                                    title="Lançar faltas"
                                                                >
                                                                    📋
                                                                </button>
                                                                <button
                                                                    onClick={() => navigate(`/planejamentos/${p.id}`)}
                                                                    className="btn-action"
                                                                    title="Editar planejamento"
                                                                >
                                                                    ✏️
                                                                </button>
                                                                <button
                                                                    onClick={() => abreModalExcluir(p)}
                                                                    className="btn-action"
                                                                    title="Excluir planejamento"
                                                                >
                                                                    🗑️
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>

                                                    {/* Botões Mobile */}
                                                    <div className="table-action table-action-mobile">
                                                        <button
                                                            onClick={() => abreModalVisualizar(p)}
                                                            className="btn-mobile btn-mobile-edit"
                                                        >
                                                            Detalhes
                                                        </button>

                                                        {podeGerenciar(p) && (
                                                            <>
                                                                <button
                                                                    onClick={() =>
                                                                        navigate(`/planejamentos/faltas/${p.id}`)
                                                                    }
                                                                    className="btn-mobile btn-mobile-faltas"
                                                                >
                                                                    Lançar Faltas
                                                                </button>
                                                                <button
                                                                    onClick={() => navigate(`/planejamentos/${p.id}`)}
                                                                    className="btn-mobile btn-mobile-edit"
                                                                >
                                                                    Editar
                                                                </button>
                                                                <button
                                                                    onClick={() => abreModalExcluir(p)}
                                                                    className="btn-mobile btn-mobile-delete"
                                                                >
                                                                    Excluir
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Paginação */}
                            {paginacao.totalPaginas > 1 && (
                                <div className="pagination">
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

                                    <div className="page-numbers">
                                        <button className="page-btn active">{paginacao.paginaAtual}</button>
                                        <span className="page-others">de {paginacao.totalPaginas}</span>
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
                            <label className="input-label">Título</label>
                            <input
                                type="text"
                                placeholder="Buscar por título..."
                                value={filtrosTemp.titulo}
                                onChange={(e) => atualizaFiltroTemp('titulo', e.target.value)}
                                className="input-field"
                            />
                        </div>

                        <div className="input-group">
                            <label className="input-label">Bimestre</label>
                            <select
                                value={filtrosTemp.bimestre}
                                onChange={(e) => atualizaFiltroTemp('bimestre', e.target.value)}
                                className={`input-select ${filtrosTemp.bimestre === '' ? 'placeholder-active' : ''}`}
                            >
                                <option value="">Todos os Bimestres</option>
                                <option value="1">1º Bimestre</option>
                                <option value="2">2º Bimestre</option>
                                <option value="3">3º Bimestre</option>
                                <option value="4">4º Bimestre</option>
                            </select>
                        </div>

                        <div className="input-group">
                            <label className="input-label">Turma</label>
                            <select
                                value={filtrosTemp.turmaId}
                                onChange={(e) => atualizaFiltroTemp('turmaId', e.target.value)}
                                className={`input-select ${filtrosTemp.turmaId === '' ? 'placeholder-active' : ''}`}
                                disabled={loadingVinculos}
                            >
                                <option value="">Todas as Turmas</option>
                                {turmasDisponiveisTemp.map((t) => (
                                    <option key={t.id} value={t.id}>
                                        {t.nomeCompleto}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="input-group">
                            <label className="input-label">Disciplina</label>
                            <select
                                value={filtrosTemp.disciplinaId}
                                onChange={(e) => atualizaFiltroTemp('disciplinaId', e.target.value)}
                                className={`input-select ${
                                    filtrosTemp.disciplinaId === '' ? 'placeholder-active' : ''
                                }`}
                                disabled={loadingVinculos}
                            >
                                <option value="">Todas as Disciplinas</option>
                                {disciplinasDisponiveisTemp.map((d) => (
                                    <option key={d.id} value={d.id}>
                                        {d.nome}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="input-group">
                            <label className="input-label">De</label>
                            <input
                                type="date"
                                value={filtrosTemp.dataInicio}
                                onChange={(e) => atualizaFiltroTemp('dataInicio', e.target.value)}
                                className="input-field"
                            />
                        </div>

                        <div className="input-group">
                            <label className="input-label">Até</label>
                            <input
                                type="date"
                                value={filtrosTemp.dataFim}
                                onChange={(e) => atualizaFiltroTemp('dataFim', e.target.value)}
                                className="input-field"
                            />
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

            {/* Modal de Visualização Rápida */}
            {modalVisualizar.aberto && modalVisualizar.planejamento && (
                <div className="modal-overlay" onClick={fechaModalVisualizar}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>{modalVisualizar.planejamento.titulo}</h2>
                        <p>
                            <strong>Data:</strong> {formataData(modalVisualizar.planejamento.data)}
                        </p>
                        <p>
                            <strong>Bimestre:</strong> {modalVisualizar.planejamento.bimestre}º Bimestre
                        </p>
                        <p>
                            <strong>Turma:</strong> {modalVisualizar.planejamento.turma?.nomeCompleto}
                        </p>
                        <p>
                            <strong>Disciplina:</strong> {modalVisualizar.planejamento.disciplina?.nome}
                        </p>
                        <p>
                            <strong>Professor:</strong> {modalVisualizar.planejamento.professor?.nome}
                        </p>
                        <p>
                            <strong>Aulas:</strong> {modalVisualizar.planejamento.numeroAulas}
                        </p>
                        {modalVisualizar.planejamento.objetivo && (
                            <p>
                                <strong>Objetivo:</strong> {modalVisualizar.planejamento.objetivo}
                            </p>
                        )}
                        {modalVisualizar.planejamento.conteudo && (
                            <p>
                                <strong>Conteúdo:</strong> {modalVisualizar.planejamento.conteudo}
                            </p>
                        )}
                        {modalVisualizar.planejamento.metodologia && (
                            <p>
                                <strong>Metodologia:</strong> {modalVisualizar.planejamento.metodologia}
                            </p>
                        )}
                        <div className="modal-action">
                            <button onClick={fechaModalVisualizar} className="btn btn-secondary">
                                Fechar
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
                            Deseja realmente excluir o planejamento <strong>{modalExcluir.titulo}</strong>?
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

export default ListaPlanejamentos;
