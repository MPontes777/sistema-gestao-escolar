import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';

const FaltasPlanejamento = () => {
    const navigate = useNavigate();
    const { planejamentoId } = useParams();

    // Dados carregados
    const [planejamento, setPlanejamento] = useState(null);
    const [alunos, setAlunos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState(null);
    const [mensagem, setMensagem] = useState({ tipo: '', texto: '' });

    // Busca por nome
    const [busca, setBusca] = useState('');

    // Edição em lote
    const [camposForm, setCamposForm] = useState({});
    const [valoresOriginais, setValoresOriginais] = useState({});
    const [errors, setErrors] = useState({});
    const [salvando, setSalvando] = useState(false);

    // Modal de sair sem salvar
    const [modalSair, setModalSair] = useState(false);

    // Carrega dados
    const carregaDados = async () => {
        try {
            setLoading(true);
            setErro(null);

            const respPlanejamento = await api.get(`/planejamentos/${planejamentoId}`);
            const planejamentoCarregado = respPlanejamento.data.dados;
            setPlanejamento(planejamentoCarregado);

            const { turma, disciplina } = planejamentoCarregado;

            const [respAlunos, respFaltas] = await Promise.all([
                api.get('/notas/lista-alunos-notas-faltas', {
                    params: { turmaId: turma.id, disciplinaId: disciplina.id },
                }),
                api.get('/faltas', { params: { planejamentoId } }),
            ]);

            // Apenas alunos que estavam matriculados na turma na data desse planejamento
            const dataPlanejamento = new Date(planejamentoCarregado.data);

            const alunosNaJanela = respAlunos.data.dados.alunos.filter((a) => {
                const inicioMatricula = new Date(a.createdAt);
                const fimMatricula = a.inativadoAt ? new Date(a.inativadoAt) : null;
                if (dataPlanejamento < inicioMatricula) return false;
                if (fimMatricula && dataPlanejamento > fimMatricula) return false;
                return true;
            });

            const faltasMap = new Map(respFaltas.data.dados.map((f) => [f.alunoId, f]));

            const alunosMontados = alunosNaJanela.map((a) => {
                const falta = faltasMap.get(a.alunoId);
                return {
                    alunoId: a.alunoId,
                    matricula: a.matricula,
                    nome: a.nome,
                    ativo: a.ativo,
                    faltaId: falta?.id ?? null,
                    faltas: falta ? falta.quantidadeFaltas : null,
                };
            });

            setAlunos(alunosMontados);

            // Faltas são representadas por um zero quando nunca foram lançadas
            const dadosForm = {};
            alunosMontados.forEach((a) => {
                dadosForm[a.alunoId] = a.faltas === null ? '0' : a.faltas.toString();
            });
            setCamposForm(dadosForm);
            setValoresOriginais(dadosForm);
        } catch (error) {
            console.error('Erro ao carregar dados do planejamento:', error);
            setErro(error.response?.data?.mensagem || 'Erro ao carregar dados. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        carregaDados();
    }, [planejamentoId]);

    // Filtro por nome
    const alunosFiltrados = useMemo(() => {
        if (!busca.trim()) return alunos;
        const termo = busca.trim().toLowerCase();
        return alunos.filter((a) => a.nome.toLowerCase().includes(termo));
    }, [alunos, busca]);

    // Verifica se algum valor de falta foi alterado
    const houveMudanca = () => alunos.some((a) => camposForm[a.alunoId] !== valoresOriginais[a.alunoId]);

    // Aviso de edição não salva
    useEffect(() => {
        const avisaSaida = (e) => {
            if (houveMudanca()) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', avisaSaida);
        return () => window.removeEventListener('beforeunload', avisaSaida);
    }, [camposForm, valoresOriginais]);

    // Atualiza algum aluno
    const mudaFormulario = (alunoId, valor) => {
        setCamposForm((prev) => ({ ...prev, [alunoId]: valor }));
        if (errors[alunoId]) {
            setErrors((prev) => ({ ...prev, [alunoId]: '' }));
        }
    };

    // Valida formulário
    const validaFormulario = () => {
        const errosForm = {};
        alunos.forEach((a) => {
            const valor = camposForm[a.alunoId];
            const valorNum = parseInt(valor);
            if (valor === '' || isNaN(valorNum) || valorNum < 0 || valorNum > planejamento.numeroAulas) {
                errosForm[a.alunoId] = `Entre 0 e ${planejamento.numeroAulas}`;
            }
        });
        setErrors(errosForm);
        return Object.keys(errosForm).length === 0;
    };

    // Descarta alterações
    const cancelaAlteracoes = () => {
        setCamposForm(valoresOriginais);
        setErrors({});
        setMensagem({ tipo: '', texto: '' });
    };

    // Salva apenas as linhas que tiveram mudanças
    const salvaFaltas = async () => {
        if (!validaFormulario()) {
            setMensagem({ tipo: 'error', texto: 'Corrija os erros no formulário.' });
            return;
        }

        const alteradas = alunos.filter((a) => camposForm[a.alunoId] !== valoresOriginais[a.alunoId]);

        if (alteradas.length === 0) {
            setErrors({});
            return;
        }

        setSalvando(true);
        setMensagem({ tipo: '', texto: '' });

        try {
            const registros = alteradas.map((a) => ({
                alunoId: a.alunoId,
                planejamentoId,
                quantidadeFaltas: parseInt(camposForm[a.alunoId]),
            }));

            await api.post('/faltas', { registros });

            // Recarrega dados
            await carregaDados();

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

    // Volta para lista de planejamentos
    const navegaParaLista = () => navigate('/planejamentos');

    const tentaVoltar = () => {
        if (houveMudanca()) {
            setModalSair(true);
            return;
        }
        navegaParaLista();
    };

    const confirmaSairSemSalvar = () => {
        setModalSair(false);
        navegaParaLista();
    };

    // Formata data
    const formataData = (data) => {
        if (!data) return '-';
        const d = new Date(data);
        const dia = String(d.getUTCDate()).padStart(2, '0');
        const mes = String(d.getUTCMonth() + 1).padStart(2, '0');
        const ano = d.getUTCFullYear();
        return `${dia}/${mes}/${ano}`;
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
                    <button onClick={carregaDados} className="btn btn-primary">
                        Tentar Novamente
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="content">
            {/* Header */}
            <div className="content-header">
                <h1 className="content-title">Lançar Faltas</h1>
                <div className="content-action">
                    <button onClick={tentaVoltar} className="btn btn-secondary" disabled={salvando}>
                        ← Voltar
                    </button>
                </div>
            </div>

            {/* Mensagem de Feedback */}
            {mensagem.texto && <div className={`alert alert-${mensagem.tipo}`}>{mensagem.texto}</div>}

            {/* Card de Informações do Planejamento */}
            <div className="card" style={{ marginBottom: '30px' }}>
                <div className="card-header">
                    <h2 className="card-section-title">📋 {planejamento.titulo}</h2>
                </div>
                <div className="card-body">
                    <div className="form-grid-4">
                        <div className="input-group">
                            <span className="input-label">Data</span>
                            <span className="input-value">{formataData(planejamento.data)}</span>
                        </div>
                        <div className="input-group">
                            <span className="input-label">Bimestre</span>
                            <span className="input-value">{planejamento.bimestre}º Bimestre</span>
                        </div>
                        <div className="input-group">
                            <span className="input-label">Turma</span>
                            <span className="input-value">{planejamento.turma?.nomeCompleto}</span>
                        </div>
                        <div className="input-group">
                            <span className="input-label">Disciplina</span>
                            <span className="input-value">{planejamento.disciplina?.nome}</span>
                        </div>
                    </div>
                    <div className="form-grid-4" style={{ marginTop: '20px' }}>
                        <div className="input-group">
                            <span className="input-label">Aulas</span>
                            <span className="input-value">{planejamento.numeroAulas}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Busca por nome */}
            <div className="content-filters">
                <div className="content-filters-group">
                    <div className="input-group">
                        <label className="input-label">Aluno</label>
                        <input
                            type="text"
                            placeholder="Buscar por nome..."
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                            className="input-field"
                        />
                    </div>
                </div>
            </div>

            {/* Lista de alunos */}
            {alunosFiltrados.length === 0 ? (
                <div className="empty">
                    <p>
                        {alunos.length === 0
                            ? 'Nenhum aluno matriculado nesta data.'
                            : 'Nenhum aluno encontrado para essa busca.'}
                    </p>
                </div>
            ) : (
                <div className="card">
                    <div className="card-body" style={{ padding: 0 }}>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Matrícula</th>
                                    <th>Nome</th>
                                    <th>Status</th>
                                    <th>Faltas</th>
                                </tr>
                            </thead>
                            <tbody>
                                {alunosFiltrados.map((a) => (
                                    <tr key={a.alunoId}>
                                        <td data-label="Matrícula">{a.matricula}</td>
                                        <td data-label="Nome" style={{ fontWeight: 600 }}>
                                            {a.nome}
                                        </td>
                                        <td data-label="Status">
                                            <span className={`badge ${a.ativo ? 'badge-verde' : 'badge-vermelha'}`}>
                                                {a.ativo ? 'Ativo' : 'Inativo'}
                                            </span>
                                        </td>
                                        <td data-label="Faltas">
                                            <input
                                                type="number"
                                                className={`input-mini ${errors[a.alunoId] ? 'input-error' : ''}`}
                                                min="0"
                                                max={planejamento.numeroAulas}
                                                value={camposForm[a.alunoId] ?? ''}
                                                onChange={(e) => mudaFormulario(a.alunoId, e.target.value)}
                                                disabled={salvando}
                                            />
                                            {errors[a.alunoId] && (
                                                <span className="message-error">{errors[a.alunoId]}</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Ações */}
            {alunos.length > 0 && (
                <div className="form-action" style={{ padding: '20px 0' }}>
                    <button type="button" className="btn btn-secondary" onClick={cancelaAlteracoes} disabled={salvando}>
                        Cancelar
                    </button>
                    <button type="button" className="btn btn-primary" onClick={salvaFaltas} disabled={salvando}>
                        {salvando ? 'Salvando...' : 'Salvar'}
                    </button>
                </div>
            )}

            {/* Modal de Sair sem salvar */}
            {modalSair && (
                <div className="modal-overlay" onClick={() => setModalSair(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>⚠️ Sair sem salvar?</h2>
                        <p>Você tem alterações não salvas nas faltas deste planejamento.</p>
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
        </div>
    );
};

export default FaltasPlanejamento;
