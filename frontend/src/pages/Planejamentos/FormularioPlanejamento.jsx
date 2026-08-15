import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';

const FormularioPlanejamento = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const editaPlanejamento = !!id;

    // Estados
    const [camposForm, setCamposForm] = useState({
        turmaId: '',
        disciplinaId: '',
        titulo: '',
        numeroAulas: '1',
        objetivo: '',
        conteudo: '',
        metodologia: '',
        data: '',
    });
    const [vinculos, setVinculos] = useState({ turmas: [], disciplinas: [], vinculos: [] });
    const [loading, setLoading] = useState(false);
    const [loadingForm, setLoadingForm] = useState(false);
    const [errors, setErrors] = useState({});
    const [mensagem, setMensagem] = useState({ tipo: '', texto: '' });

    // Carrega dados
    useEffect(() => {
        carregaVinculos();
        if (editaPlanejamento) {
            carregaDadosPlanejamento();
        }
    }, [id]);

    // Carrega vínculos professor-turma-disciplina (turmas/disciplinas que o professor leciona)
    const carregaVinculos = async () => {
        try {
            const response = await api.get('/planejamentos/vinculos');
            setVinculos(response.data.dados || { turmas: [], disciplinas: [], vinculos: [] });
        } catch (error) {
            console.error('Erro ao carregar vínculos:', error);
            setMensagem({
                tipo: 'error',
                texto: 'Erro ao carregar turmas/disciplinas. Tente novamente.',
            });
        }
    };

    // Carrega dados do planejamento (edição)
    const carregaDadosPlanejamento = async () => {
        setLoadingForm(true);
        try {
            const response = await api.get(`/planejamentos/${id}`);
            const planejamento = response.data.dados;

            const dataFormatada = planejamento.data ? new Date(planejamento.data).toISOString().split('T')[0] : '';

            setCamposForm({
                turmaId: planejamento.turmaId || '',
                disciplinaId: planejamento.disciplinaId || '',
                titulo: planejamento.titulo || '',
                numeroAulas: planejamento.numeroAulas?.toString() || '1',
                objetivo: planejamento.objetivo || '',
                conteudo: planejamento.conteudo || '',
                metodologia: planejamento.metodologia || '',
                data: dataFormatada,
            });
        } catch (error) {
            console.error('Erro ao carregar planejamento:', error);
            setMensagem({
                tipo: 'error',
                texto: 'Erro ao carregar dados do planejamento.',
            });
        } finally {
            setLoadingForm(false);
        }
    };

    // Disciplinas válidas para a turma selecionada (cascata)
    const disciplinasDisponiveis = () => {
        if (!camposForm.turmaId) return vinculos.disciplinas;

        const disciplinaIds = vinculos.vinculos
            .filter((v) => v.turmaId === camposForm.turmaId)
            .map((v) => v.disciplinaId);

        return vinculos.disciplinas.filter((d) => disciplinaIds.includes(d.id));
    };

    // Valida todos os campos do formulário
    const validaFormulario = () => {
        const errosForm = {};

        if (!camposForm.turmaId) {
            errosForm.turmaId = 'Turma é obrigatória';
        }

        if (!camposForm.disciplinaId) {
            errosForm.disciplinaId = 'Disciplina é obrigatória';
        }

        if (!camposForm.titulo.trim()) {
            errosForm.titulo = 'Título é obrigatório';
        } else if (camposForm.titulo.trim().length > 200) {
            errosForm.titulo = 'Título deve ter no máximo 200 caracteres';
        }

        const numeroAulasInt = parseInt(camposForm.numeroAulas);
        if (!camposForm.numeroAulas || isNaN(numeroAulasInt) || numeroAulasInt < 1 || numeroAulasInt > 6) {
            errosForm.numeroAulas = 'Número de aulas deve ser um valor entre 1 e 6';
        }

        if (!camposForm.data) {
            errosForm.data = 'Data é obrigatória';
        }

        setErrors(errosForm);
        return Object.keys(errosForm).length === 0;
    };

    // Atualiza campos do formulário
    const mudaFormulario = (e) => {
        const { name, value } = e.target;

        setCamposForm((prev) => {
            const atualizado = { ...prev, [name]: value };

            // Reseta disciplina se a turma mudar e a disciplina atual não for mais válida
            if (name === 'turmaId') {
                const disciplinaIds = vinculos.vinculos.filter((v) => v.turmaId === value).map((v) => v.disciplinaId);

                if (!disciplinaIds.includes(prev.disciplinaId)) {
                    atualizado.disciplinaId = '';
                }
            }

            return atualizado;
        });

        // Remove erro do campo quando usuário começa a editar
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    // Envia formulário
    const enviaFormulario = async (e) => {
        e.preventDefault();

        if (!validaFormulario()) {
            setMensagem({
                tipo: 'error',
                texto: 'Corrija os erros no formulário.',
            });
            return;
        }

        setLoading(true);
        setMensagem({ tipo: '', texto: '' });

        try {
            if (editaPlanejamento) {
                // Edição: turma/disciplina não são enviadas (não editáveis)
                const dadosParaEnviar = {
                    titulo: camposForm.titulo.trim(),
                    numeroAulas: parseInt(camposForm.numeroAulas),
                    objetivo: camposForm.objetivo.trim(),
                    conteudo: camposForm.conteudo.trim(),
                    metodologia: camposForm.metodologia.trim(),
                    data: camposForm.data,
                };

                await api.put(`/planejamentos/${id}`, dadosParaEnviar);
                setMensagem({
                    tipo: 'success',
                    texto: 'Planejamento atualizado',
                });
            } else {
                const dadosParaEnviar = {
                    turmaId: camposForm.turmaId,
                    disciplinaId: camposForm.disciplinaId,
                    titulo: camposForm.titulo.trim(),
                    numeroAulas: parseInt(camposForm.numeroAulas),
                    objetivo: camposForm.objetivo.trim(),
                    conteudo: camposForm.conteudo.trim(),
                    metodologia: camposForm.metodologia.trim(),
                    data: camposForm.data,
                };

                await api.post('/planejamentos', dadosParaEnviar);
                setMensagem({
                    tipo: 'success',
                    texto: 'Planejamento cadastrado',
                });
            }

            setTimeout(() => {
                navigate('/planejamentos');
            }, 2000);
        } catch (error) {
            console.error('Erro ao salvar planejamento:', error);
            const mensagemErro = error.response?.data?.mensagem || 'Erro ao salvar planejamento. Tente novamente.';
            setMensagem({
                tipo: 'error',
                texto: mensagemErro,
            });
        } finally {
            setLoading(false);
        }
    };

    // Cancela
    const cancelaFormulario = () => {
        navigate('/planejamentos');
    };

    // Loading
    if (loadingForm) {
        return (
            <div className="content">
                <div className="loading">Carregando dados do planejamento...</div>
            </div>
        );
    }

    const semVinculos = !editaPlanejamento && vinculos.vinculos.length === 0;

    return (
        <div className="content">
            {/* Header */}
            <div className="content-header">
                <h1 className="content-title">
                    {editaPlanejamento ? 'Editar Planejamento' : 'Cadastrar Planejamento'}
                </h1>
            </div>

            {/* Aviso: sem vínculos */}
            {semVinculos && (
                <div className="alert alert-error">
                    Você ainda não está vinculado a nenhuma turma/disciplina. Entre em contato com a administração para
                    poder cadastrar planejamentos.
                </div>
            )}

            {/* Mensagem de Feedback */}
            {mensagem.texto && <div className={`alert alert-${mensagem.tipo}`}>{mensagem.texto}</div>}

            {/* Formulário */}
            <div className="form-container">
                <form onSubmit={enviaFormulario} noValidate>
                    <div className="form-grid-2">
                        {/* Turma */}
                        <div className="input-group">
                            <label className="input-label input-label-required" htmlFor="turmaId">
                                Turma
                            </label>
                            <select
                                id="turmaId"
                                name="turmaId"
                                className={`input-select ${errors.turmaId ? 'input-error' : ''} ${
                                    !camposForm.turmaId ? 'placeholder-active' : ''
                                }`}
                                value={camposForm.turmaId}
                                onChange={mudaFormulario}
                                disabled={loading || editaPlanejamento || semVinculos}
                            >
                                <option value="">Selecione a turma...</option>
                                {vinculos.turmas.map((turma) => (
                                    <option key={turma.id} value={turma.id}>
                                        {turma.nomeCompleto}
                                    </option>
                                ))}
                            </select>
                            {errors.turmaId && <span className="message-error">{errors.turmaId}</span>}
                        </div>

                        {/* Disciplina */}
                        <div className="input-group">
                            <label className="input-label input-label-required" htmlFor="disciplinaId">
                                Disciplina
                            </label>
                            <select
                                id="disciplinaId"
                                name="disciplinaId"
                                className={`input-select ${errors.disciplinaId ? 'input-error' : ''} ${
                                    !camposForm.disciplinaId ? 'placeholder-active' : ''
                                }`}
                                value={camposForm.disciplinaId}
                                onChange={mudaFormulario}
                                disabled={loading || editaPlanejamento || semVinculos || !camposForm.turmaId}
                            >
                                <option value="">Selecione a disciplina...</option>
                                {disciplinasDisponiveis().map((disciplina) => (
                                    <option key={disciplina.id} value={disciplina.id}>
                                        {disciplina.nome}
                                    </option>
                                ))}
                            </select>
                            {errors.disciplinaId && <span className="message-error">{errors.disciplinaId}</span>}
                        </div>

                        {/* Título */}
                        <div className="input-group">
                            <label className="input-label input-label-required" htmlFor="titulo">
                                Título
                            </label>
                            <input
                                type="text"
                                id="titulo"
                                name="titulo"
                                className={`input-field ${errors.titulo ? 'input-error' : ''}`}
                                placeholder="Ex: Introdução às frações"
                                value={camposForm.titulo}
                                onChange={mudaFormulario}
                                maxLength="200"
                                disabled={loading || semVinculos}
                            />
                            {errors.titulo && <span className="message-error">{errors.titulo}</span>}
                        </div>

                        {/* Número de Aulas */}
                        <div className="input-group">
                            <label className="input-label input-label-required" htmlFor="numeroAulas">
                                Número de Aulas
                            </label>
                            <input
                                type="number"
                                id="numeroAulas"
                                name="numeroAulas"
                                className={`input-field ${errors.numeroAulas ? 'input-error' : ''}`}
                                value={camposForm.numeroAulas}
                                onChange={mudaFormulario}
                                step="1"
                                min="1"
                                max="6"
                                disabled={loading || semVinculos}
                            />
                            {errors.numeroAulas && <span className="message-error">{errors.numeroAulas}</span>}
                        </div>

                        {/* Data */}
                        <div className="input-group">
                            <label className="input-label input-label-required" htmlFor="data">
                                Data
                            </label>
                            <input
                                type="date"
                                id="data"
                                name="data"
                                className={`input-field ${errors.data ? 'input-error' : ''}`}
                                value={camposForm.data}
                                onChange={mudaFormulario}
                                disabled={loading || semVinculos}
                            />
                            {errors.data && <span className="message-error">{errors.data}</span>}
                        </div>
                    </div>

                    {/* Objetivo */}
                    <div className="input-group">
                        <label className="input-label" htmlFor="objetivo">
                            Objetivo
                        </label>
                        <textarea
                            id="objetivo"
                            name="objetivo"
                            className="input-field"
                            placeholder="Objetivo da aula (opcional)"
                            value={camposForm.objetivo}
                            onChange={mudaFormulario}
                            rows="3"
                            disabled={loading || semVinculos}
                        />
                    </div>

                    {/* Conteúdo */}
                    <div className="input-group">
                        <label className="input-label" htmlFor="conteudo">
                            Conteúdo
                        </label>
                        <textarea
                            id="conteudo"
                            name="conteudo"
                            className="input-field"
                            placeholder="Conteúdo abordado (opcional)"
                            value={camposForm.conteudo}
                            onChange={mudaFormulario}
                            rows="3"
                            disabled={loading || semVinculos}
                        />
                    </div>

                    {/* Metodologia */}
                    <div className="input-group">
                        <label className="input-label" htmlFor="metodologia">
                            Metodologia
                        </label>
                        <textarea
                            id="metodologia"
                            name="metodologia"
                            className="input-field"
                            placeholder="Metodologia utilizada (opcional)"
                            value={camposForm.metodologia}
                            onChange={mudaFormulario}
                            rows="3"
                            disabled={loading || semVinculos}
                        />
                    </div>

                    <div className="form-action">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={cancelaFormulario}
                            disabled={loading}
                        >
                            Cancelar
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading || semVinculos}>
                            {loading ? 'Salvando...' : 'Salvar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FormularioPlanejamento;
