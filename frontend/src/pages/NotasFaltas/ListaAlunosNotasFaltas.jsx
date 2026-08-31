import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import api, { getUser } from '../../services/api';

const ListaAlunosNotasFaltas = () => {
    const navigate = useNavigate();
    const { turmaId } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const disciplinaIdUrl = searchParams.get('disciplinaId') || '';
    const usuario = getUser();
    const admin = usuario?.perfil === 'admin';

    // Estados
    const [vinculos, setVinculos] = useState({ disciplinas: [], vinculos: [] });
    const [disciplinaId, setDisciplinaId] = useState(disciplinaIdUrl);
    const [turma, setTurma] = useState(null);
    const [alunos, setAlunos] = useState([]);
    const [loadingVinculos, setLoadingVinculos] = useState(true);
    const [loadingAlunos, setLoadingAlunos] = useState(false);
    const [erro, setErro] = useState(null);

    // Filtros
    const [filtros, setFiltros] = useState({
        busca: '',
        status: 'todos',
        resultado: 'todos',
    });
    const [modalFiltros, setModalFiltros] = useState(false);
    const [filtrosTemp, setFiltrosTemp] = useState({
        busca: '',
        status: 'todos',
        resultado: 'todos',
    });

    // Ordenação
    const [ordenacao, setOrdenacao] = useState({ campo: 'nome', ordem: 'asc' });

    // Carrega vínculos
    const carregaVinculos = async () => {
        try {
            setLoadingVinculos(true);
            setErro(null);

            const response = await api.get('/notas/vinculos');
            setVinculos(response.data.dados);
        } catch (error) {
            console.error('Erro ao buscar vínculos:', error);
            setErro('Erro ao carregar disciplinas disponíveis.');
        } finally {
            setLoadingVinculos(false);
        }
    };

    // Carrega os alunos da turma+disciplina selecionada
    const carregaAlunos = async (idDisciplina) => {
        try {
            setLoadingAlunos(true);
            setErro(null);

            const response = await api.get('/notas/lista-alunos-notas-faltas', {
                params: { turmaId, disciplinaId: idDisciplina },
            });
            setTurma(response.data.dados.turma);
            setAlunos(response.data.dados.alunos);
        } catch (error) {
            console.error('Erro ao buscar alunos:', error);
            setErro(error.response?.data?.mensagem || 'Erro ao carregar alunos. Tente novamente.');
        } finally {
            setLoadingAlunos(false);
        }
    };

    useEffect(() => {
        carregaVinculos();
    }, []);

    // Disciplinas vinculadas a essa turma específica
    const disciplinasDaTurma = useMemo(() => {
        const idsValidos = new Set(vinculos.vinculos.filter((v) => v.turmaId === turmaId).map((v) => v.disciplinaId));
        return vinculos.disciplinas.filter((d) => idsValidos.has(d.id));
    }, [vinculos, turmaId]);

    // Carregar vínculos e garante que a disciplina selecionada é válida pra essa turma
    useEffect(() => {
        if (loadingVinculos || disciplinasDaTurma.length === 0) return;

        const disciplinaValida = disciplinasDaTurma.some((d) => d.id === disciplinaId);
        if (!disciplinaValida) {
            setDisciplinaId(disciplinasDaTurma[0].id);
        }
    }, [loadingVinculos, disciplinasDaTurma]);

    // Busca alunos sempre que a disciplina selecionada mudar
    useEffect(() => {
        if (!disciplinaId) return;
        setSearchParams({ disciplinaId }, { replace: true });
        carregaAlunos(disciplinaId);
    }, [disciplinaId]);

    // Abre modal de filtros no mobile
    const abreModalFiltros = () => {
        setFiltrosTemp(filtros);
        setModalFiltros(true);
    };

    // Fecha modal de filtros sem aplicar
    const fechaModalFiltros = () => {
        setModalFiltros(false);
    };

    // Aplica os filtros escolhidos no modal
    const aplicaFiltros = () => {
        setFiltros(filtrosTemp);
        setModalFiltros(false);
    };

    // Limpa os filtros
    const limpaFiltros = () => {
        const filtrosPadrao = { busca: '', status: 'todos', resultado: 'todos' };
        setFiltros(filtrosPadrao);
        setModalFiltros(false);
    };

    // Atualiza filtro no desktop
    const atualizaFiltro = (campo, valor) => {
        setFiltros((prev) => ({ ...prev, [campo]: valor }));
    };

    // Atualiza filtro temporário no mobile
    const atualizaFiltroTemp = (campo, valor) => {
        setFiltrosTemp((prev) => ({ ...prev, [campo]: valor }));
    };

    // Média
    const media = (aluno) => aluno.mediaFinal ?? aluno.mediaParcial ?? null;

    // Classe da cor da média
    const classeMedia = (valor) => {
        if (valor === null) return 'media-vazia';
        return valor >= 6.0 ? 'media-boa' : 'media-ruim';
    };
    const textoMedia = (valor) => (valor === null ? '-' : valor.toFixed(1));

    // Badge do resultado
    const classeResultado = (resultado) => {
        switch (resultado) {
            case 'Aprovado':
                return 'badge-verde';
            case 'Reprovado':
                return 'badge-vermelha';
            case 'Cursando':
                return 'badge-azul';
            default:
                return null;
        }
    };

    // Valor de cada ordenação
    const valorOrdenacao = (aluno, campo) => {
        switch (campo) {
            case 'status':
                return aluno.ativo ? 'Ativo' : 'Inativo';
            case 'percentualPresenca':
                return aluno.percentualPresenca ?? 0;
            case 'media':
                return media(aluno) ?? 0;
            case 'motivoAprovacao':
                return aluno.motivoAprovacao ?? '-';
            default:
                return aluno[campo]; // matricula, nome, resultado
        }
    };

    const comparaAlunos = (a, b, campo, ordem) => {
        const valorA = valorOrdenacao(a, campo);
        const valorB = valorOrdenacao(b, campo);

        let comparacao;
        if (typeof valorA === 'number' && typeof valorB === 'number') {
            comparacao = valorA - valorB;
        } else {
            comparacao = String(valorA).localeCompare(String(valorB), 'pt-BR');
        }

        return ordem === 'asc' ? comparacao : -comparacao;
    };

    // Muda ordenação das colunas
    const mudaOrdenacao = (campo) => {
        setOrdenacao((prev) => ({
            campo,
            ordem: prev.campo === campo && prev.ordem === 'asc' ? 'desc' : 'asc',
        }));
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

    // Filtro e ordenação em memória
    const alunosExibidos = useMemo(() => {
        let resultado = [...alunos];

        if (filtros.busca.trim()) {
            const termo = filtros.busca.trim().toLowerCase();
            resultado = resultado.filter((a) => a.nome.toLowerCase().includes(termo));
        }
        if (filtros.status !== 'todos') {
            resultado = resultado.filter((a) => (filtros.status === 'ativo' ? a.ativo : !a.ativo));
        }
        if (filtros.resultado !== 'todos') {
            resultado = resultado.filter((a) => a.resultado === filtros.resultado);
        }

        resultado.sort((a, b) => comparaAlunos(a, b, ordenacao.campo, ordenacao.ordem));

        return resultado;
    }, [alunos, filtros, ordenacao]);

    // Navegações da coluna de Ações
    const navegaLancarNotas = (alunoId) => {
        navigate(`/notas-faltas/lancar-notas/${alunoId}?turmaId=${turmaId}&disciplinaId=${disciplinaId}`);
    };
    const navegaLancarFaltas = (alunoId) => {
        navigate(`/notas-faltas/lancar-faltas/${alunoId}?turmaId=${turmaId}&disciplinaId=${disciplinaId}`);
    };
    const navegaVerNotasFaltas = (alunoId) => {
        navigate(`/notas-faltas/ver/${alunoId}?turmaId=${turmaId}&disciplinaId=${disciplinaId}`);
    };

    const loading = loadingVinculos || loadingAlunos;

    return (
        <div className="content">
            {/* Header */}
            <div className="content-header">
                <div className="titulo-com-seletor">
                    <div>
                        <h1 className="content-title">{turma ? turma.nomeCompleto : 'Notas e Faltas'}</h1>
                        {turma && <p className="turma-etapa">{turma.etapa}</p>}
                    </div>

                    <select
                        value={disciplinaId}
                        onChange={(e) => setDisciplinaId(e.target.value)}
                        className="disciplina-select"
                        disabled={loadingVinculos || disciplinasDaTurma.length <= 1}
                    >
                        {disciplinasDaTurma.map((d) => (
                            <option key={d.id} value={d.id}>
                                {d.nome}
                            </option>
                        ))}
                    </select>
                </div>

                <button onClick={() => navigate('/turmas-notas-faltas')} className="btn btn-secondary">
                    ← Voltar
                </button>
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
                    <button onClick={() => carregaAlunos(disciplinaId)} className="btn btn-primary">
                        Tentar Novamente
                    </button>
                </div>
            )}

            {/* Conteúdo */}
            {!loading && !erro && (
                <>
                    {/* Botão de Filtros Mobile */}
                    <button onClick={abreModalFiltros} className="btn-open-filters">
                        🔍 Filtros
                    </button>

                    {/* Filtros Desktop */}
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
                                <label className="input-label">Resultado</label>
                                <select
                                    value={filtros.resultado}
                                    onChange={(e) => atualizaFiltro('resultado', e.target.value)}
                                    className={`input-select ${filtros.resultado === 'todos' ? 'placeholder-active' : ''}`}
                                >
                                    <option value="todos">Todos os Resultados</option>
                                    <option value="Aprovado">Aprovado</option>
                                    <option value="Reprovado">Reprovado</option>
                                    <option value="Cursando">Cursando</option>
                                    <option value="-">-</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {alunosExibidos.length === 0 ? (
                        <div className="empty">
                            <p>Nenhum aluno encontrado.</p>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table className="table table-alunos-notas">
                                <thead>
                                    <tr>
                                        <th className="sort-header" onClick={() => mudaOrdenacao('status')}>
                                            Status
                                            {setaOrdenacao('status')}
                                        </th>
                                        <th className="sort-header" onClick={() => mudaOrdenacao('matricula')}>
                                            Matrícula
                                            {setaOrdenacao('matricula')}
                                        </th>
                                        <th className="sort-header" onClick={() => mudaOrdenacao('nome')}>
                                            Nome
                                            {setaOrdenacao('nome')}
                                        </th>
                                        <th>Faltas</th>
                                        <th className="sort-header" onClick={() => mudaOrdenacao('percentualPresenca')}>
                                            % Presença
                                            {setaOrdenacao('percentualPresenca')}
                                        </th>
                                        <th className="sort-header" onClick={() => mudaOrdenacao('media')}>
                                            Média
                                            {setaOrdenacao('media')}
                                        </th>
                                        <th className="sort-header" onClick={() => mudaOrdenacao('resultado')}>
                                            Resultado
                                            {setaOrdenacao('resultado')}
                                        </th>
                                        <th className="sort-header" onClick={() => mudaOrdenacao('motivoAprovacao')}>
                                            Motivo Aprovação
                                            {setaOrdenacao('motivoAprovacao')}
                                        </th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {alunosExibidos.map((aluno) => (
                                        <tr key={aluno.alunoId}>
                                            <td data-label="Status">
                                                <span
                                                    className={`badge ${aluno.ativo ? 'badge-verde' : 'badge-vermelha'}`}
                                                >
                                                    {aluno.ativo ? 'Ativo' : 'Inativo'}
                                                </span>
                                            </td>
                                            <td data-label="Matrícula">{aluno.matricula}</td>
                                            <td data-label="Nome" style={{ fontWeight: '600' }}>
                                                {aluno.nome}
                                            </td>
                                            <td data-label="Faltas">
                                                {aluno.totalFaltas}/{aluno.totalAulas}
                                            </td>
                                            <td
                                                data-label="% Presença"
                                                className={
                                                    aluno.percentualPresenca !== null && aluno.percentualPresenca < 75
                                                        ? 'presenca-baixa'
                                                        : ''
                                                }
                                            >
                                                {aluno.percentualPresenca === null
                                                    ? '-'
                                                    : `${aluno.percentualPresenca.toFixed(1).replace('.', ',')}%`}
                                            </td>
                                            <td data-label="Média" className={classeMedia(media(aluno))}>
                                                {textoMedia(media(aluno))}
                                            </td>
                                            <td data-label="Resultado">
                                                {classeResultado(aluno.resultado) ? (
                                                    <span className={`badge ${classeResultado(aluno.resultado)}`}>
                                                        {aluno.resultado}
                                                    </span>
                                                ) : (
                                                    <span className="resultado-vazio">{aluno.resultado}</span>
                                                )}
                                            </td>
                                            <td data-label="Motivo Aprovação">{aluno.motivoAprovacao ?? '-'}</td>
                                            <td data-label="Ações">
                                                {/* Botões Desktop */}
                                                <div className="table-action">
                                                    <button
                                                        onClick={() => navegaVerNotasFaltas(aluno.alunoId)}
                                                        className="btn-action"
                                                        title="Ver Notas e Faltas"
                                                    >
                                                        👁️
                                                    </button>
                                                    {aluno.ativo && (
                                                        <button
                                                            onClick={() => navegaLancarNotas(aluno.alunoId)}
                                                            className="btn-action"
                                                            title="Lançar Notas"
                                                        >
                                                            📝
                                                        </button>
                                                    )}
                                                    {aluno.ativo && !admin && (
                                                        <button
                                                            onClick={() => navegaLancarFaltas(aluno.alunoId)}
                                                            className="btn-action"
                                                            title="Lançar Faltas"
                                                        >
                                                            📋
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Botões Mobile */}
                                                <div className="table-action table-action-mobile">
                                                    <button
                                                        onClick={() => navegaVerNotasFaltas(aluno.alunoId)}
                                                        className="btn-mobile btn-mobile-edit"
                                                    >
                                                        Ver Notas e Faltas
                                                    </button>
                                                    {aluno.ativo && (
                                                        <button
                                                            onClick={() => navegaLancarNotas(aluno.alunoId)}
                                                            className="btn-mobile btn-mobile-edit"
                                                        >
                                                            Lançar Notas
                                                        </button>
                                                    )}
                                                    {aluno.ativo && !admin && (
                                                        <button
                                                            onClick={() => navegaLancarFaltas(aluno.alunoId)}
                                                            className="btn-mobile btn-mobile-faltas"
                                                        >
                                                            Lançar Faltas
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
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
                            <label className="input-label">Resultado</label>
                            <select
                                value={filtrosTemp.resultado}
                                onChange={(e) => atualizaFiltroTemp('resultado', e.target.value)}
                                className="input-select"
                            >
                                <option value="todos">Todos os Resultados</option>
                                <option value="Aprovado">Aprovado</option>
                                <option value="Reprovado">Reprovado</option>
                                <option value="Cursando">Cursando</option>
                                <option value="-">-</option>
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
        </div>
    );
};

export default ListaAlunosNotasFaltas;
