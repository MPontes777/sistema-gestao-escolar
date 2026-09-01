import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import api, { getUser } from '../../services/api';

const camposBimestre = ['bimestre1', 'bimestre2', 'bimestre3', 'bimestre4'];
const motivosValidos = ['Recuperação', 'Conselho de Classe', 'Outro'];

const Notas = () => {
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
    const [nota, setNota] = useState(null);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState(null);
    const [mensagem, setMensagem] = useState({ tipo: '', texto: '' });

    // Edição de bimestres
    const [modoEdicao, setModoEdicao] = useState(false);
    const [camposForm, setCamposForm] = useState({ bimestre1: '', bimestre2: '', bimestre3: '', bimestre4: '' });
    const [valoresOriginais, setValoresOriginais] = useState(null);
    const [errors, setErrors] = useState({});
    const [salvando, setSalvando] = useState(false);

    // Modal de sair sem salvar
    const [modalSair, setModalSair] = useState(false);

    // Modal de registrar motivo
    const [modalMotivo, setModalMotivo] = useState({ aberto: false, motivo: '', descricao: '' });
    const [errosMotivo, setErrosMotivo] = useState({});
    const [salvandoMotivo, setSalvandoMotivo] = useState(false);

    // Modal de excluir motivo
    const [modalExcluirMotivo, setModalExcluirMotivo] = useState(false);

    // Carrega dados do aluno e suas notas
    const carregaDados = async () => {
        try {
            setLoading(true);
            setErro(null);

            const [respAlunos, respNotas] = await Promise.all([
                api.get('/notas/lista-alunos-notas-faltas', { params: { turmaId, disciplinaId } }),
                api.get('/notas', { params: { alunoId, disciplinaId, turmaId } }),
            ]);

            const alunoEncontrado = respAlunos.data.dados.alunos.find((a) => a.alunoId === alunoId);

            if (!alunoEncontrado) {
                setErro('Aluno não encontrado nesta turma/disciplina.');
                return;
            }

            setTurma(respAlunos.data.dados.turma);
            setAluno(alunoEncontrado);

            const notaExistente = respNotas.data.dados[0] || null;
            setNota(notaExistente);

            const dadosForm = {
                bimestre1: notaExistente?.bimestre1?.toString() ?? '',
                bimestre2: notaExistente?.bimestre2?.toString() ?? '',
                bimestre3: notaExistente?.bimestre3?.toString() ?? '',
                bimestre4: notaExistente?.bimestre4?.toString() ?? '',
            };
            setCamposForm(dadosForm);
        } catch (error) {
            console.error('Erro ao carregar dados de notas:', error);
            setErro(error.response?.data?.mensagem || 'Erro ao carregar dados. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    // Carrega vínculos
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

    // Disciplinas vinculadas a turma
    const disciplinasDaTurma = useMemo(() => {
        const idsValidos = new Set(vinculos.vinculos.filter((v) => v.turmaId === turmaId).map((v) => v.disciplinaId));
        return vinculos.disciplinas.filter((d) => idsValidos.has(d.id));
    }, [vinculos, turmaId]);

    // Troca a disciplina selecionada (Apenas fora do modo de edição)
    const mudaDisciplina = (novaDisciplinaId) => {
        setMensagem({ tipo: '', texto: '' });
        setSearchParams({ turmaId, disciplinaId: novaDisciplinaId });
    };

    // Verifica se algum bimestre foi alterado
    const houveMudanca = () => {
        if (!valoresOriginais) return false;
        return camposBimestre.some((campo) => camposForm[campo] !== valoresOriginais[campo]);
    };

    // Aviso de edição não salva
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

    // Entra no modo de edição dos bimestres
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

    // Atualiza campo do formulário
    const mudaFormulario = (e) => {
        const { name, value } = e.target;
        setCamposForm((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    // Valida os 4 campos de bimestre
    const validaFormulario = () => {
        const errosForm = {};
        camposBimestre.forEach((campo) => {
            const valor = camposForm[campo];
            if (valor === '') return; // bimestre em branco é permitido

            const valorNum = parseFloat(valor);
            if (isNaN(valorNum) || valorNum < 0 || valorNum > 10) {
                errosForm[campo] = 'Valor entre 0 e 10';
            }
        });
        setErrors(errosForm);
        return Object.keys(errosForm).length === 0;
    };

    // Salva os bimestres
    const salvaNotas = async () => {
        if (!validaFormulario()) {
            setMensagem({ tipo: 'error', texto: 'Corrija os erros no formulário.' });
            return;
        }

        setSalvando(true);
        setMensagem({ tipo: '', texto: '' });

        try {
            const registro = { alunoId, disciplinaId };
            camposBimestre.forEach((campo) => {
                registro[campo] = camposForm[campo] === '' ? null : parseFloat(camposForm[campo]);
            });

            const response = await api.post('/notas', { registros: [registro] });
            const notaSalva = response.data.dados[0];

            setNota(notaSalva);

            const dadosFormAtualizados = {
                bimestre1: notaSalva.bimestre1?.toString() ?? '',
                bimestre2: notaSalva.bimestre2?.toString() ?? '',
                bimestre3: notaSalva.bimestre3?.toString() ?? '',
                bimestre4: notaSalva.bimestre4?.toString() ?? '',
            };
            setCamposForm(dadosFormAtualizados);
            setValoresOriginais(dadosFormAtualizados);
            setModoEdicao(false);
            setMensagem({ tipo: 'success', texto: 'Notas salvas com sucesso.' });
        } catch (error) {
            console.error('Erro ao salvar notas:', error);
            setMensagem({
                tipo: 'error',
                texto: error.response?.data?.mensagem || 'Erro ao salvar notas. Tente novamente.',
            });
        } finally {
            setSalvando(false);
        }
    };

    // Navega para lista de alunos da turma
    const navegaParaLista = () => {
        navigate(`/alunos-notas-faltas/${turmaId}?disciplinaId=${disciplinaId}`);
    };

    // Verifica edição não salva
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

    // Modal de registrar motivo
    const abreModalMotivo = () => {
        setModalMotivo({ aberto: true, motivo: '', descricao: '' });
        setErrosMotivo({});
    };

    const fechaModalMotivo = () => {
        setModalMotivo({ aberto: false, motivo: '', descricao: '' });
        setErrosMotivo({});
    };

    const mudaModalMotivo = (campo, valor) => {
        setModalMotivo((prev) => ({ ...prev, [campo]: valor }));
        if (errosMotivo[campo]) {
            setErrosMotivo((prev) => ({ ...prev, [campo]: '' }));
        }
    };

    const confirmaMotivo = async () => {
        const erros = {};
        if (!modalMotivo.motivo) erros.motivo = 'Selecione um motivo';
        if (modalMotivo.motivo === 'Outro' && !modalMotivo.descricao.trim()) {
            erros.descricao = 'Descrição é obrigatória quando o motivo é "Outro"';
        }
        if (Object.keys(erros).length > 0) {
            setErrosMotivo(erros);
            return;
        }

        setSalvandoMotivo(true);
        try {
            let notaId = nota?.id;

            // Se o aluno ainda não tem nenhuma nota lançada, cria um registro vazio primeiro
            if (!notaId) {
                const respCriacao = await api.post('/notas', {
                    registros: [{ alunoId, disciplinaId, bimestre1: null }],
                });
                notaId = respCriacao.data.dados[0].id;
            }

            const response = await api.put(`/notas/${notaId}`, {
                motivoAprovacao: modalMotivo.motivo,
                motivoDescricao: modalMotivo.motivo === 'Outro' ? modalMotivo.descricao.trim() : null,
            });
            setNota(response.data.dados);
            fechaModalMotivo();
            setMensagem({ tipo: 'success', texto: 'Motivo de aprovação registrado.' });
        } catch (error) {
            console.error('Erro ao registrar motivo:', error);
            setMensagem({
                tipo: 'error',
                texto: error.response?.data?.mensagem || 'Erro ao registrar motivo. Tente novamente.',
            });
            fechaModalMotivo();
        } finally {
            setSalvandoMotivo(false);
        }
    };

    // Modal de excluir motivo
    const confirmaExclusaoMotivo = async () => {
        setSalvandoMotivo(true);
        try {
            const response = await api.put(`/notas/${nota.id}`, { motivoAprovacao: null });
            setNota(response.data.dados);
            setModalExcluirMotivo(false);
            setMensagem({ tipo: 'success', texto: 'Motivo de aprovação removido.' });
        } catch (error) {
            console.error('Erro ao remover motivo:', error);
            setMensagem({
                tipo: 'error',
                texto: error.response?.data?.mensagem || 'Erro ao remover motivo. Tente novamente.',
            });
            setModalExcluirMotivo(false);
        } finally {
            setSalvandoMotivo(false);
        }
    };

    // Média
    const media = nota?.mediaFinal ?? nota?.mediaParcial ?? null;

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

    // "Cursando" não aparece pra aluno inativo
    const resultadoBase = nota?.resultado ?? 'Cursando';
    const resultadoExibicao = aluno && !aluno.ativo && resultadoBase === 'Cursando' ? '-' : resultadoBase;

    const podeEditar = aluno?.ativo; // Alunos inativos: histórico só leitura

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
                    <h1 className="content-title">Notas</h1>

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

            {/* Card de Situação Atual */}
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
                                {classeResultado(resultadoExibicao) ? (
                                    <span className={`badge ${classeResultado(resultadoExibicao)}`}>
                                        {resultadoExibicao}
                                    </span>
                                ) : (
                                    <span className="input-value">{resultadoExibicao}</span>
                                )}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Card de Bimestres */}
            <div className="card" style={{ marginBottom: '30px' }}>
                <div className="card-header card-header-action">
                    <h2 className="card-section-title">📝 Notas por Bimestre</h2>
                    {podeEditar && !modoEdicao && (
                        <button onClick={iniciaEdicao} className="btn btn-primary">
                            Lançar Notas
                        </button>
                    )}
                </div>
                <div className="card-body">
                    {!podeEditar && (
                        <div className="alert alert-info">
                            As notas estão disponíveis apenas para consulta para alunos inativos.
                        </div>
                    )}

                    <div className="form-rows">
                        <div className="form-grid-4">
                            {camposBimestre.map((campo, index) => (
                                <div className="input-group" key={campo}>
                                    <label className="input-label" htmlFor={campo}>
                                        {index + 1}º Bimestre
                                    </label>
                                    {modoEdicao ? (
                                        <>
                                            <input
                                                type="number"
                                                id={campo}
                                                name={campo}
                                                className={`input-field ${errors[campo] ? 'input-error' : ''}`}
                                                placeholder="Ex: 7.5"
                                                value={camposForm[campo]}
                                                onChange={mudaFormulario}
                                                step="0.1"
                                                min="0"
                                                max="10"
                                                disabled={salvando}
                                            />
                                            {errors[campo] && <span className="message-error">{errors[campo]}</span>}
                                        </>
                                    ) : (
                                        <span
                                            className="input-value"
                                            style={{
                                                color:
                                                    camposForm[campo] === ''
                                                        ? undefined
                                                        : coresMedia[classeMedia(parseFloat(camposForm[campo]))],
                                            }}
                                        >
                                            {camposForm[campo] === '' ? '-' : parseFloat(camposForm[campo]).toFixed(1)}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {modoEdicao && (
                        <div className="form-action">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={cancelaEdicao}
                                disabled={salvando}
                            >
                                Cancelar
                            </button>
                            <button type="button" className="btn btn-primary" onClick={salvaNotas} disabled={salvando}>
                                {salvando ? 'Salvando...' : 'Salvar'}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Card de Motivo de Aprovação */}
            <div className="card">
                <div className="card-header card-header-action">
                    <h2 className="card-section-title">📌 Motivo de Aprovação</h2>
                    {admin &&
                        (nota?.motivoAprovacao ? (
                            <button
                                onClick={() => setModalExcluirMotivo(true)}
                                className="btn btn-danger"
                                disabled={modoEdicao || salvandoMotivo}
                            >
                                Excluir Motivo
                            </button>
                        ) : (
                            <button
                                onClick={abreModalMotivo}
                                className="btn btn-primary"
                                disabled={modoEdicao || salvandoMotivo}
                            >
                                Registrar Motivo
                            </button>
                        ))}
                </div>
                <div className="card-body">
                    {nota?.motivoAprovacao ? (
                        <div className="form-grid-2">
                            <div className="input-group">
                                <span className="input-label">Motivo</span>
                                <span className="input-value">{nota.motivoAprovacao}</span>
                            </div>
                            {nota.motivoDescricao && (
                                <div className="input-group">
                                    <span className="input-label">Descrição</span>
                                    <span className="input-value">{nota.motivoDescricao}</span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <p style={{ color: '#7f8c8d', margin: 0 }}>Nenhum motivo de aprovação registrado.</p>
                    )}
                </div>
            </div>

            {/* Modal de Sair sem salvar */}
            {modalSair && (
                <div className="modal-overlay" onClick={() => setModalSair(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>⚠️ Sair sem salvar?</h2>
                        <p>Você tem alterações não salvas nas notas deste aluno.</p>
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

            {/* Modal de Registrar Motivo */}
            {modalMotivo.aberto && (
                <div className="modal-overlay" onClick={fechaModalMotivo}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>📌 Registrar Motivo de Aprovação</h2>

                        <div className="input-group">
                            <label className="input-label input-label-required" htmlFor="motivo">
                                Motivo
                            </label>
                            <select
                                id="motivo"
                                className={`input-select ${errosMotivo.motivo ? 'input-error' : ''}`}
                                value={modalMotivo.motivo}
                                onChange={(e) => mudaModalMotivo('motivo', e.target.value)}
                                disabled={salvandoMotivo}
                            >
                                <option value="">Selecione...</option>
                                {motivosValidos.map((m) => (
                                    <option key={m} value={m}>
                                        {m}
                                    </option>
                                ))}
                            </select>
                            {errosMotivo.motivo && <span className="message-error">{errosMotivo.motivo}</span>}
                        </div>

                        {modalMotivo.motivo === 'Outro' && (
                            <div className="input-group">
                                <label className="input-label input-label-required" htmlFor="descricao">
                                    Descrição
                                </label>
                                <textarea
                                    id="descricao"
                                    className={`input-field ${errosMotivo.descricao ? 'input-error' : ''}`}
                                    placeholder="Descreva o motivo da aprovação"
                                    value={modalMotivo.descricao}
                                    onChange={(e) => mudaModalMotivo('descricao', e.target.value)}
                                    rows="3"
                                    disabled={salvandoMotivo}
                                />
                                {errosMotivo.descricao && (
                                    <span className="message-error">{errosMotivo.descricao}</span>
                                )}
                            </div>
                        )}

                        <div className="modal-action">
                            <button onClick={fechaModalMotivo} className="btn btn-secondary" disabled={salvandoMotivo}>
                                Cancelar
                            </button>
                            <button onClick={confirmaMotivo} className="btn btn-primary" disabled={salvandoMotivo}>
                                {salvandoMotivo ? 'Salvando...' : 'Registrar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Excluir Motivo */}
            {modalExcluirMotivo && (
                <div className="modal-overlay" onClick={() => setModalExcluirMotivo(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>⚠️ Confirmar Exclusão</h2>
                        <p>Deseja realmente excluir o motivo de aprovação registrado para este aluno?</p>
                        <p className="modal-warning">
                            O resultado voltará a ser calculado automaticamente pela média e presença.
                        </p>
                        <div className="modal-action">
                            <button
                                onClick={() => setModalExcluirMotivo(false)}
                                className="btn btn-secondary"
                                disabled={salvandoMotivo}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmaExclusaoMotivo}
                                className="btn btn-danger"
                                disabled={salvandoMotivo}
                            >
                                {salvandoMotivo ? 'Excluindo...' : 'Excluir'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Notas;
