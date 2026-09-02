import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import api, { getUser } from '../../services/api';

const linhasPorPagina = 10;

const Faltas = () => {
    const navigate = useNavigate();
    const { alunoId } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const turmaId = searchParams.get('turmaId');
    const disciplinaId = searchParams.get('disciplinaId');
    const usuario = getUser();
    const admin = usuario?.perfil === 'admin';

    // Dados carregados
    const [vinculos, setVinculos] = useState({ disciplinas: [], vinculos: [] });
    const [turma, setTurma] = useState(null);
    const [aluno, setAluno] = useState(null);
    const [linhas, setLinhas] = useState([]); // planejamentos + falta do aluno, já dentro da janela de matrícula
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState(null);
    const [mensagem, setMensagem] = useState({ tipo: '', texto: '' });

    // Filtros (client-side) e paginação
    const [filtros, setFiltros] = useState({ dataInicio: '', dataFim: '', bimestre: 'todos', justificada: 'todos' });
    const [paginaAtual, setPaginaAtual] = useState(1);

    // Edição em lote (professor)
    const [modoEdicao, setModoEdicao] = useState(false);
    const [camposForm, setCamposForm] = useState({});
    const [valoresOriginais, setValoresOriginais] = useState(null);
    const [errors, setErrors] = useState({});
    const [salvando, setSalvando] = useState(false);

    // Modal de sair sem salvar
    const [modalSair, setModalSair] = useState(false);

    // Modal de Justificar / Editar Justificativa (admin)
    const [modalJustificar, setModalJustificar] = useState({ aberto: false, tipo: 'criar', data: '', descricao: '' });
    const [itensModal, setItensModal] = useState([]);
    const [salvandoJustificativa, setSalvandoJustificativa] = useState(false);

    // Carrega dados do aluno, planejamentos da turma+disciplina e faltas já lançadas para esse aluno
    const carregaDados = async () => {
        try {
            setLoading(true);
            setErro(null);

            const [respAlunos, respPlanejamentos, respFaltas] = await Promise.all([
                api.get('/notas/lista-alunos-notas-faltas', { params: { turmaId, disciplinaId } }),
                api.get('/planejamentos', {
                    params: { turmaId, disciplinaId, ordenarPor: 'data', ordem: 'desc', limit: 300 },
                }),
                api.get('/faltas', { params: { alunoId, turmaId, disciplinaId } }),
            ]);

            const alunoEncontrado = respAlunos.data.dados.alunos.find((a) => a.alunoId === alunoId);

            if (!alunoEncontrado) {
                setErro('Aluno não encontrado nesta turma/disciplina.');
                return;
            }

            setTurma(respAlunos.data.dados.turma);
            setAluno(alunoEncontrado);

            // Só planejamentos dentro da janela de matrícula do aluno (mesma regra do calculaPresenca)
            const inicioMatricula = new Date(alunoEncontrado.createdAt);
            const fimMatricula = alunoEncontrado.inativadoAt ? new Date(alunoEncontrado.inativadoAt) : null;

            const planejamentosNaJanela = respPlanejamentos.data.dados.planejamentos.filter((p) => {
                const dataPlanejamento = new Date(p.data);
                if (dataPlanejamento < inicioMatricula) return false;
                if (fimMatricula && dataPlanejamento > fimMatricula) return false;
                return true;
            });

            const faltasMap = new Map(respFaltas.data.dados.map((f) => [f.planejamentoId, f]));

            const linhasMontadas = planejamentosNaJanela.map((p) => {
                const falta = faltasMap.get(p.id);
                return {
                    planejamentoId: p.id,
                    faltaId: falta?.id ?? null,
                    data: p.data,
                    titulo: p.titulo,
                    bimestre: p.bimestre,
                    numeroAulas: p.numeroAulas,
                    faltas: falta ? falta.quantidadeFaltas : null,
                    justificativa: falta?.justificativa ?? null,
                };
            });

            setLinhas(linhasMontadas);

            // Todo campo já nasce com um número válido (0 quando nunca foi lançado) — nunca em branco
            const dadosForm = {};
            linhasMontadas.forEach((l) => {
                dadosForm[l.planejamentoId] = l.faltas === null ? '0' : l.faltas.toString();
            });
            setCamposForm(dadosForm);
        } catch (error) {
            console.error('Erro ao carregar dados de faltas:', error);
            setErro(error.response?.data?.mensagem || 'Erro ao carregar dados. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    // Carrega vínculos (mesmo endpoint reaproveitado de Notas.jsx)
    const carregaVinculos = async () => {
        try {
            const response = await api.get('/notas/vinculos');
            setVinculos(response.data.dados);
        } catch (error) {
            console.error('Erro ao buscar vínculos:', error);
        }
    };

    useEffect(() => {
        carregaVinculos();
    }, []);

    useEffect(() => {
        if (!turmaId || !disciplinaId) {
            setErro('Turma ou disciplina não informada.');
            setLoading(false);
            return;
        }
        carregaDados();
    }, [disciplinaId]);

    // Disciplinas vinculadas a turma (mesmo padrão de Notas.jsx)
    const disciplinasDaTurma = useMemo(() => {
        const idsValidos = new Set(vinculos.vinculos.filter((v) => v.turmaId === turmaId).map((v) => v.disciplinaId));
        return vinculos.disciplinas.filter((d) => idsValidos.has(d.id));
    }, [vinculos, turmaId]);

    // Troca a disciplina selecionada (apenas fora do modo de edição)
    const mudaDisciplina = (novaDisciplinaId) => {
        setMensagem({ tipo: '', texto: '' });
        setSearchParams({ turmaId, disciplinaId: novaDisciplinaId });
    };

    // Verifica se algum valor de falta foi alterado
    const houveMudanca = () => {
        if (!valoresOriginais) return false;
        return linhas.some((l) => camposForm[l.planejamentoId] !== valoresOriginais[l.planejamentoId]);
    };

    // Aviso de edição não salva (mesmo padrão de Notas.jsx, limitação conhecida #7)
    useEffect(() => {
        const avisaSaida = (e) => {
            if (modoEdicao && houveMudanca()) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', avisaSaida);
        return () => window.removeEventListener('beforeunload', avisaSaida);
    }, [modoEdicao, camposForm, valoresOriginais]);

    // Entra no modo de edição em lote
    const iniciaEdicao = () => {
        setValoresOriginais(camposForm);
        setModoEdicao(true);
        setMensagem({ tipo: '', texto: '' });
    };

    // Descarta as alterações e volta pro modo visualização
    const cancelaEdicao = () => {
        setCamposForm(valoresOriginais);
        setErrors({});
        setModoEdicao(false);
    };

    // Atualiza o campo de um planejamento específico
    const mudaFormulario = (planejamentoId, valor) => {
        setCamposForm((prev) => ({ ...prev, [planejamentoId]: valor }));
        if (errors[planejamentoId]) {
            setErrors((prev) => ({ ...prev, [planejamentoId]: '' }));
        }
    };

    // Valida cada linha — sempre um número entre 0 e o número de aulas daquele planejamento
    const validaFormulario = () => {
        const errosForm = {};
        linhas.forEach((l) => {
            const valor = camposForm[l.planejamentoId];
            const valorNum = parseInt(valor);
            if (valor === '' || isNaN(valorNum) || valorNum < 0 || valorNum > l.numeroAulas) {
                errosForm[l.planejamentoId] = `Entre 0 e ${l.numeroAulas}`;
            }
        });
        setErrors(errosForm);
        return Object.keys(errosForm).length === 0;
    };

    // Salva só as linhas que realmente mudaram (evita poluir o audit log com "atualizada: 2 → 2")
    const salvaFaltas = async () => {
        if (!validaFormulario()) {
            setMensagem({ tipo: 'error', texto: 'Corrija os erros no formulário.' });
            return;
        }

        const alteradas = linhas.filter((l) => camposForm[l.planejamentoId] !== valoresOriginais[l.planejamentoId]);

        if (alteradas.length === 0) {
            setErrors({});
            setModoEdicao(false);
            return;
        }

        setSalvando(true);
        setMensagem({ tipo: '', texto: '' });

        try {
            const registros = alteradas.map((l) => ({
                alunoId,
                planejamentoId: l.planejamentoId,
                quantidadeFaltas: parseInt(camposForm[l.planejamentoId]),
            }));

            await api.post('/faltas', { registros });

            // Recarrega tudo — linhas, faltas totais, % presença e resultado (recalculado
            // no backend) ficam corretos de novo. Substitui o patch manual que só
            // atualizava `linhas` e deixava o card de Situação Atual desatualizado.
            await carregaDados();

            setModoEdicao(false);
            setMensagem({ tipo: 'success', texto: 'Faltas salvas com sucesso.' });
        } catch (error) {
            console.error('Erro ao salvar faltas:', error);
            setMensagem({
                tipo: 'error',
                texto: error.response?.data?.mensagem || 'Erro ao salvar faltas. Tente novamente.',
            });
        } finally {
            setSalvando(false);
        }
    };

    // Navega para lista de alunos da turma
    const navegaParaLista = () => {
        navigate(`/alunos-notas-faltas/${turmaId}?disciplinaId=${disciplinaId}`);
    };

    const tentaVoltar = () => {
        if (modoEdicao && houveMudanca()) {
            setModalSair(true);
            return;
        }
        navegaParaLista();
    };

    const confirmaSairSemSalvar = () => {
        setModalSair(false);
        navegaParaLista();
    };

    // Só professor lança falta (decisão #19), só aluno ativo (mesmo espírito da #47)
    const podeEditar = !admin && aluno?.ativo;

    // Formata data no padrão pt-BR (mesma função já usada em DetalhesTurma.jsx)
    const formataData = (data) => new Date(data).toLocaleDateString('pt-BR');

    // Mesmo tratamento visual de Média/Resultado usado em Notas.jsx (com `?.` porque
    // `aluno` ainda é null no primeiro render, antes do carregaDados() terminar)
    const media = aluno?.mediaFinal ?? aluno?.mediaParcial ?? null;

    const classeMedia = (valor) => {
        if (valor === null || valor === undefined) return 'media-vazia';
        return valor >= 6.0 ? 'media-boa' : 'media-ruim';
    };

    const coresMedia = { 'media-boa': '#27ae60', 'media-ruim': '#e74c3c', 'media-vazia': '#bdc3c7' };

    const textoMedia = (valor) => (valor === null || valor === undefined ? '-' : valor.toFixed(1));

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

    // Filtros e paginação — tudo client-side (Decisão 1, opção B)
    const linhasFiltradas = useMemo(() => {
        return linhas.filter((l) => {
            const dataSlice = typeof l.data === 'string' ? l.data.slice(0, 10) : '';
            if (filtros.dataInicio && dataSlice < filtros.dataInicio) return false;
            if (filtros.dataFim && dataSlice > filtros.dataFim) return false;
            if (filtros.bimestre !== 'todos' && l.bimestre !== parseInt(filtros.bimestre)) return false;

            if (filtros.justificada === 'sim') {
                if (!l.faltas || l.faltas === 0 || !l.justificativa) return false;
            }
            return true;
        });
    }, [linhas, filtros]);

    const totalPaginas = Math.max(1, Math.ceil(linhasFiltradas.length / linhasPorPagina));

    useEffect(() => {
        if (paginaAtual > totalPaginas) setPaginaAtual(totalPaginas);
    }, [totalPaginas]);

    const inicioPagina = (paginaAtual - 1) * linhasPorPagina;
    const linhasPagina = linhasFiltradas.slice(inicioPagina, inicioPagina + linhasPorPagina);

    const atualizaFiltro = (campo, valor) => {
        setFiltros((prev) => ({ ...prev, [campo]: valor }));
        setPaginaAtual(1);
    };

    const limpaFiltros = () => {
        setFiltros({ dataInicio: '', dataFim: '', bimestre: 'todos', justificada: 'todos' });
        setPaginaAtual(1);
    };

    const mudaPagina = (novaPagina) => {
        if (novaPagina >= 1 && novaPagina <= totalPaginas) {
            setPaginaAtual(novaPagina);
        }
    };

    // Datas do período do filtro (e do modal) ficam clampadas na janela de matrícula do aluno
    const dataMinFiltro = aluno ? new Date(aluno.createdAt).toISOString().slice(0, 10) : undefined;
    const dataMaxFiltro = aluno?.inativadoAt ? new Date(aluno.inativadoAt).toISOString().slice(0, 10) : undefined;

    // ===== Modal Justificar / Editar Justificativa =====
    const dataISO = (d) => (typeof d === 'string' ? d.slice(0, 10) : new Date(d).toISOString().slice(0, 10));

    // Monta a lista de planejamentos daquele dia que têm falta lançada (só esses podem ser justificados)
    const montaItensModal = (dataIsoSelecionada) => {
        return linhas
            .filter((l) => l.faltas > 0 && dataISO(l.data) === dataIsoSelecionada)
            .map((l) => ({
                planejamentoId: l.planejamentoId,
                faltaId: l.faltaId,
                titulo: l.titulo,
                bimestre: l.bimestre,
                faltas: l.faltas,
                justificativaOriginal: l.justificativa,
                marcado: !!l.justificativa,
            }));
    };

    // Entrada 1: botão "Justificar" do cabeçalho — data em branco, admin escolhe
    const abreModalNovo = () => {
        setModalJustificar({ aberto: true, tipo: 'criar', data: '', descricao: '' });
        setItensModal([]);
    };

    // Entrada 2: clique na flag de uma linha — data pré-preenchida, descrição vem da própria falta clicada
    const abreModalEdicao = (planejamentoId) => {
        const linhaClicada = linhas.find((l) => l.planejamentoId === planejamentoId);
        if (!linhaClicada) return;

        const dataIsoSelecionada = dataISO(linhaClicada.data);
        setModalJustificar({
            aberto: true,
            tipo: 'editar',
            data: dataIsoSelecionada,
            descricao: linhaClicada.justificativa || '',
        });
        setItensModal(montaItensModal(dataIsoSelecionada));
    };

    const fechaModalJustificar = () => {
        setModalJustificar({ aberto: false, tipo: 'criar', data: '', descricao: '' });
        setItensModal([]);
    };

    const mudaDataModal = (novaData) => {
        setModalJustificar((prev) => ({ ...prev, data: novaData }));
        setItensModal(novaData ? montaItensModal(novaData) : []);
    };

    const mudaDescricaoModal = (valor) => {
        setModalJustificar((prev) => ({ ...prev, descricao: valor }));
    };

    const alternaItemModal = (planejamentoId) => {
        setItensModal((prev) =>
            prev.map((item) => (item.planejamentoId === planejamentoId ? { ...item, marcado: !item.marcado } : item)),
        );
    };

    const marcaTodosModal = (valor) => {
        setItensModal((prev) => prev.map((item) => ({ ...item, marcado: valor })));
    };

    // Só habilita Confirmar/Salvar quando há uma mudança real a aplicar
    const modalTemMudanca = itensModal.some((item) => item.marcado || (!item.marcado && item.justificativaOriginal));
    const modalPrecisaDescricao = itensModal.some((item) => item.marcado) && !modalJustificar.descricao.trim();
    const podeConfirmarModal = !!modalJustificar.data && modalTemMudanca && !modalPrecisaDescricao;

    // Salva sem atomicidade: uma chamada PUT /faltas/:id por item alterado (decisão confirmada)
    const confirmaJustificativa = async () => {
        setSalvandoJustificativa(true);
        setMensagem({ tipo: '', texto: '' });

        const descricaoAtual = modalJustificar.descricao.trim();
        let sucessos = 0;
        let falhas = 0;

        for (const item of itensModal) {
            const precisaAplicar = item.marcado;
            const precisaRemover = !item.marcado && item.justificativaOriginal;

            if (!precisaAplicar && !precisaRemover) continue;

            try {
                await api.put(`/faltas/${item.faltaId}`, {
                    justificativa: precisaAplicar ? descricaoAtual : null,
                });
                sucessos++;
            } catch (error) {
                console.error(`Erro ao atualizar justificativa da falta ${item.faltaId}:`, error);
                falhas++;
            }
        }

        // Recarrega do zero pra refletir o estado real do banco — mais simples e seguro
        // do que reconciliar manualmente no client, especialmente sem atomicidade
        await carregaDados();

        setSalvandoJustificativa(false);
        fechaModalJustificar();

        if (falhas === 0) {
            setMensagem({ tipo: 'success', texto: 'Justificativa(s) atualizada(s) com sucesso.' });
        } else {
            setMensagem({
                tipo: 'error',
                texto: `${sucessos} atualizada(s), ${falhas} falharam. Verifique e tente novamente.`,
            });
        }
    };

    if (loading) {
        return (
            <div className="content">
                <div className="loading">Carregando dados...</div>
            </div>
        );
    }

    if (erro) {
        return (
            <div className="content">
                <div className="error">
                    <p>⚠️ {erro}</p>
                    <button onClick={tentaVoltar} className="btn btn-primary">
                        Voltar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="content">
            {/* Header */}
            <div className="content-header">
                <div className="titulo-com-seletor">
                    <h1 className="content-title">Faltas</h1>
                    <select
                        value={disciplinaId}
                        onChange={(e) => mudaDisciplina(e.target.value)}
                        className="disciplina-select"
                        disabled={modoEdicao || disciplinasDaTurma.length <= 1}
                    >
                        {disciplinasDaTurma.map((d) => (
                            <option key={d.id} value={d.id}>
                                {d.nome}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="content-action">
                    <button onClick={tentaVoltar} className="btn btn-secondary" disabled={salvando}>
                        ← Voltar
                    </button>
                </div>
            </div>

            {/* Mensagem de Feedback */}
            {mensagem.texto && <div className={`alert alert-${mensagem.tipo}`}>{mensagem.texto}</div>}

            {/* Card de Situação Atual (idêntico a Notas.jsx) */}
            <div className="card" style={{ marginBottom: '30px' }}>
                <div className="card-header">
                    <h2 className="card-section-title">📊 Situação Atual</h2>
                </div>
                <div className="card-body">
                    <div className="form-grid-4" style={{ marginBottom: '25px' }}>
                        <div className="input-group">
                            <span className="input-label">Matrícula</span>
                            <span className="input-value">{aluno.matricula}</span>
                        </div>
                        <div className="input-group">
                            <span className="input-label">Nome</span>
                            <span className="input-value">{aluno.nome}</span>
                        </div>
                        <div className="input-group">
                            <span className="input-label">Turma</span>
                            <span className="input-value">{turma.nomeCompleto}</span>
                        </div>
                        <div className="input-group">
                            <span className="input-label">Status</span>
                            <span>
                                <span className={`badge ${aluno.ativo ? 'badge-verde' : 'badge-vermelha'}`}>
                                    {aluno.ativo ? 'Ativo' : 'Inativo'}
                                </span>
                            </span>
                        </div>
                    </div>
                    <div className="form-grid-4">
                        <div className="input-group">
                            <span className="input-label">Faltas</span>
                            <span className="input-value">
                                {aluno.totalFaltas}/{aluno.totalAulas}
                            </span>
                        </div>
                        <div className="input-group">
                            <span className="input-label">Presença</span>
                            <span className="input-value">
                                {aluno.percentualPresenca === null
                                    ? '-'
                                    : `${aluno.percentualPresenca.toFixed(1).replace('.', ',')}%`}
                            </span>
                        </div>
                        <div className="input-group">
                            <span className="input-label">Média</span>
                            <span className="input-value" style={{ color: coresMedia[classeMedia(media)] }}>
                                {textoMedia(media)}
                            </span>
                        </div>
                        <div className="input-group">
                            <span className="input-label">Resultado</span>
                            <span>
                                {classeResultado(aluno.resultado) ? (
                                    <span className={`badge ${classeResultado(aluno.resultado)}`}>
                                        {aluno.resultado}
                                    </span>
                                ) : (
                                    <span className="input-value">{aluno.resultado}</span>
                                )}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filtros — bloco independente, mesmo padrão de ListaPlanejamentos.jsx */}
            <div className="content-filters">
                <div className="content-filters-group">
                    <div className="input-group">
                        <label className="input-label">De</label>
                        <input
                            type="date"
                            className="input-field"
                            min={dataMinFiltro}
                            max={dataMaxFiltro}
                            value={filtros.dataInicio}
                            onChange={(e) => atualizaFiltro('dataInicio', e.target.value)}
                        />
                    </div>
                    <div className="input-group">
                        <label className="input-label">Até</label>
                        <input
                            type="date"
                            className="input-field"
                            min={dataMinFiltro}
                            max={dataMaxFiltro}
                            value={filtros.dataFim}
                            onChange={(e) => atualizaFiltro('dataFim', e.target.value)}
                        />
                    </div>
                    <div className="input-group">
                        <label className="input-label">Bimestre</label>
                        <select
                            className="input-select"
                            value={filtros.bimestre}
                            onChange={(e) => atualizaFiltro('bimestre', e.target.value)}
                        >
                            <option value="todos">Todos os Bimestres</option>
                            <option value="1">1º Bimestre</option>
                            <option value="2">2º Bimestre</option>
                            <option value="3">3º Bimestre</option>
                            <option value="4">4º Bimestre</option>
                        </select>
                    </div>
                    <div className="input-group">
                        <label className="input-label">Faltas Justificadas</label>
                        <select
                            className="input-select"
                            value={filtros.justificada}
                            onChange={(e) => atualizaFiltro('justificada', e.target.value)}
                        >
                            <option value="todos">Mostrar Tudo</option>
                            <option value="sim">Apenas Justificadas</option>
                        </select>
                    </div>
                    <div className="input-group">
                        <label className="input-label">&nbsp;</label>
                        <button onClick={limpaFiltros} className="btn btn-secondary">
                            Limpar filtros
                        </button>
                    </div>
                </div>
            </div>

            {/* Card de Faltas por Planejamento */}
            <div className="card">
                <div className="card-header card-header-action">
                    <h2 className="card-section-title">📋 Faltas por Planejamento</h2>
                    {podeEditar && !modoEdicao && (
                        <button onClick={iniciaEdicao} className="btn btn-primary">
                            Lançar Faltas
                        </button>
                    )}
                    {admin && (
                        <button onClick={abreModalNovo} className="btn btn-primary">
                            Justificar
                        </button>
                    )}
                </div>

                {!aluno.ativo && (
                    <div style={{ padding: '20px 30px 0' }}>
                        <div className="alert alert-info">
                            As faltas estão disponíveis apenas para consulta para alunos inativos.
                        </div>
                    </div>
                )}

                {linhasFiltradas.length === 0 ? (
                    <div className="card-body">
                        <div className="empty">
                            <p>Nenhum planejamento encontrado para os filtros selecionados.</p>
                        </div>
                    </div>
                ) : (
                    <div className="card-body" style={{ padding: 0 }}>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Data</th>
                                    <th>Bimestre</th>
                                    <th>Título</th>
                                    <th>Aulas</th>
                                    <th>Faltas</th>
                                    <th>Justificativa</th>
                                </tr>
                            </thead>
                            <tbody>
                                {linhasPagina.map((l) => (
                                    <tr key={l.planejamentoId}>
                                        <td>{formataData(l.data)}</td>
                                        <td>{l.bimestre}º</td>
                                        <td style={{ fontWeight: 600 }}>{l.titulo}</td>
                                        <td>{l.numeroAulas}</td>
                                        <td>
                                            {modoEdicao ? (
                                                <>
                                                    <input
                                                        type="number"
                                                        className={`input-mini ${errors[l.planejamentoId] ? 'input-error' : ''}`}
                                                        min="0"
                                                        max={l.numeroAulas}
                                                        value={camposForm[l.planejamentoId]}
                                                        onChange={(e) =>
                                                            mudaFormulario(l.planejamentoId, e.target.value)
                                                        }
                                                        disabled={salvando}
                                                    />
                                                    {errors[l.planejamentoId] && (
                                                        <span className="message-error">
                                                            {errors[l.planejamentoId]}
                                                        </span>
                                                    )}
                                                </>
                                            ) : (
                                                <span className="input-value">
                                                    {l.faltas ?? 0}/{l.numeroAulas}
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            {l.faltas > 0 ? (
                                                <button
                                                    type="button"
                                                    className={`flag-justificativa ${admin ? 'clicavel' : ''}`}
                                                    disabled={!admin}
                                                    onClick={
                                                        admin ? () => abreModalEdicao(l.planejamentoId) : undefined
                                                    }
                                                    title={admin ? 'Editar justificativa deste dia' : undefined}
                                                >
                                                    {l.justificativa ? '🚩' : '🏳️'}
                                                    {l.justificativa && (
                                                        <span className="tooltip">{l.justificativa}</span>
                                                    )}
                                                </button>
                                            ) : (
                                                <span style={{ color: '#dcdfe3' }}>—</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Paginação — mesmo componente de DetalhesTurma.jsx */}
                        <div className="page-container">
                            <div className="page-info">
                                <p>
                                    Mostrando {inicioPagina + 1} a{' '}
                                    {Math.min(inicioPagina + linhasPorPagina, linhasFiltradas.length)} de{' '}
                                    {linhasFiltradas.length} planejamento(s)
                                </p>
                            </div>
                            {totalPaginas > 1 && (
                                <div className="page-controller">
                                    <button
                                        onClick={() => mudaPagina(1)}
                                        disabled={paginaAtual === 1}
                                        className="page-btn"
                                        title="Primeira página"
                                    >
                                        «
                                    </button>
                                    <button
                                        onClick={() => mudaPagina(paginaAtual - 1)}
                                        disabled={paginaAtual === 1}
                                        className="page-btn"
                                        title="Página anterior"
                                    >
                                        ‹
                                    </button>
                                    <div className="page-number">
                                        {paginaAtual > 2 && (
                                            <>
                                                <button onClick={() => mudaPagina(1)} className="page-btn">
                                                    1
                                                </button>
                                                {paginaAtual > 3 && <span className="page-others">...</span>}
                                            </>
                                        )}
                                        {paginaAtual > 1 && (
                                            <button onClick={() => mudaPagina(paginaAtual - 1)} className="page-btn">
                                                {paginaAtual - 1}
                                            </button>
                                        )}
                                        <button className="page-btn active">{paginaAtual}</button>
                                        {paginaAtual < totalPaginas && (
                                            <button onClick={() => mudaPagina(paginaAtual + 1)} className="page-btn">
                                                {paginaAtual + 1}
                                            </button>
                                        )}
                                        {paginaAtual < totalPaginas - 1 && (
                                            <>
                                                {paginaAtual < totalPaginas - 2 && (
                                                    <span className="page-others">...</span>
                                                )}
                                                <button onClick={() => mudaPagina(totalPaginas)} className="page-btn">
                                                    {totalPaginas}
                                                </button>
                                            </>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => mudaPagina(paginaAtual + 1)}
                                        disabled={paginaAtual === totalPaginas}
                                        className="page-btn"
                                        title="Próxima página"
                                    >
                                        ›
                                    </button>
                                    <button
                                        onClick={() => mudaPagina(totalPaginas)}
                                        disabled={paginaAtual === totalPaginas}
                                        className="page-btn"
                                        title="Última página"
                                    >
                                        »
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {modoEdicao && (
                    <div className="form-action" style={{ padding: '0 30px 30px' }}>
                        <button type="button" className="btn btn-secondary" onClick={cancelaEdicao} disabled={salvando}>
                            Cancelar
                        </button>
                        <button type="button" className="btn btn-primary" onClick={salvaFaltas} disabled={salvando}>
                            {salvando ? 'Salvando...' : 'Salvar'}
                        </button>
                    </div>
                )}
            </div>

            {/* Modal de Sair sem salvar */}
            {modalSair && (
                <div className="modal-overlay" onClick={() => setModalSair(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>⚠️ Sair sem salvar?</h2>
                        <p>Você tem alterações não salvas nas faltas deste aluno.</p>
                        <p className="modal-warning">Se sair agora, as alterações serão perdidas.</p>
                        <div className="modal-action">
                            <button onClick={() => setModalSair(false)} className="btn btn-secondary">
                                Continuar Editando
                            </button>
                            <button onClick={confirmaSairSemSalvar} className="btn btn-danger">
                                Sair sem Salvar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Justificar / Editar Justificativa (admin) */}
            {modalJustificar.aberto && (
                <div className="modal-overlay" onClick={fechaModalJustificar}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>📌 {modalJustificar.tipo === 'criar' ? 'Justificar Faltas' : 'Editar Justificativa'}</h2>

                        <div className="input-group">
                            <label className="input-label" htmlFor="modalData">
                                Data
                            </label>
                            <input
                                type="date"
                                id="modalData"
                                className="input-field"
                                min={dataMinFiltro}
                                max={dataMaxFiltro}
                                value={modalJustificar.data}
                                onChange={(e) => mudaDataModal(e.target.value)}
                                disabled={salvandoJustificativa || modalJustificar.tipo === 'editar'}
                            />
                        </div>

                        {modalJustificar.data &&
                            (itensModal.length === 0 ? (
                                <p className="modal-vazio">Nenhuma falta lançada para esse aluno nesta data.</p>
                            ) : (
                                <div className="lista-planejamentos-dia">
                                    <label className="selecionar-todos">
                                        <input
                                            type="checkbox"
                                            checked={itensModal.every((item) => item.marcado)}
                                            onChange={(e) => marcaTodosModal(e.target.checked)}
                                            disabled={salvandoJustificativa}
                                        />
                                        Selecionar todos ({itensModal.length})
                                    </label>
                                    {itensModal.map((item) => (
                                        <label className="item-planejamento-dia" key={item.planejamentoId}>
                                            <input
                                                type="checkbox"
                                                checked={item.marcado}
                                                onChange={() => alternaItemModal(item.planejamentoId)}
                                                disabled={salvandoJustificativa}
                                            />
                                            <span>
                                                <b>{item.titulo}</b> — {item.bimestre}º bimestre, {item.faltas} falta(s)
                                                {item.justificativaOriginal && (
                                                    <span className="ja-justificada">
                                                        ✓ já justificada — desmarque para remover
                                                    </span>
                                                )}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            ))}

                        <div className="input-group">
                            <label className="input-label" htmlFor="modalDescricao">
                                Descrição da justificativa
                            </label>
                            <textarea
                                id="modalDescricao"
                                className="input-textarea"
                                rows="3"
                                placeholder="Ex: Atestado médico entregue na secretaria"
                                value={modalJustificar.descricao}
                                onChange={(e) => mudaDescricaoModal(e.target.value)}
                                disabled={salvandoJustificativa}
                            />
                        </div>

                        <div className="modal-action">
                            <button
                                onClick={fechaModalJustificar}
                                className="btn btn-secondary"
                                disabled={salvandoJustificativa}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmaJustificativa}
                                className="btn btn-primary"
                                disabled={!podeConfirmarModal || salvandoJustificativa}
                            >
                                {salvandoJustificativa
                                    ? 'Salvando...'
                                    : modalJustificar.tipo === 'criar'
                                      ? 'Justificar'
                                      : 'Salvar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Faltas;
