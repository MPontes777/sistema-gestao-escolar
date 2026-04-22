import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';

const FormularioTurma = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const editaTurma = !!id;

    // Estados
    const [camposForm, setCamposForm] = useState({
        anoSerieId: '',
        letra: '',
        anoLetivo: new Date().getFullYear().toString(),
        periodo: '',
    });
    const [anosSeries, setAnosSeries] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingForm, setLoadingForm] = useState(false);
    const [errors, setErrors] = useState({});
    const [mensagem, setMensagem] = useState({ tipo: '', texto: '' });
    const [prevUpdate, setPrevUpdate] = useState(null);

    // Carrega dados
    useEffect(() => {
        carregaAnosSeries();
        if (editaTurma) {
            carregaDadosTurma();
        }
    }, [id]);

    // Carrega lista de anos/séries
    const carregaAnosSeries = async () => {
        try {
            const response = await api.get('/turmas/ano-serie');
            setAnosSeries(response.data.dados || []);
        } catch (error) {
            console.error('Erro ao carregar anos/séries:', error);
            setMensagem({
                tipo: 'error',
                texto: 'Erro ao carregar anos/séries. Tente novamente.',
            });
        }
    };

    // Carrega dados da turma
    const carregaDadosTurma = async () => {
        setLoadingForm(true);
        try {
            const response = await api.get(`/turmas/${id}`);
            const turma = response.data.dados;

            const dadosForm = {
                anoSerieId: turma.anoSerieId || '',
                letra: turma.letra || '',
                anoLetivo: turma.anoLetivo?.toString() || '',
                periodo: turma.periodo || '',
            };

            setCamposForm(dadosForm);
            setPrevUpdate(dadosForm);
        } catch (error) {
            console.error('Erro ao carregar turma:', error);
            setMensagem({
                tipo: 'error',
                texto: 'Erro ao carregar dados da turma.',
            });
        } finally {
            setLoadingForm(false);
        }
    };

    // Gera preview do nome completo
    const geraPreviewNome = () => {
        const anoSerie = anosSeries.find((a) => a.id === camposForm.anoSerieId);
        if (!anoSerie || !camposForm.anoLetivo) return null;

        const letra = camposForm.letra.trim().toUpperCase();
        const nome = letra
            ? `${anoSerie.nome} ${letra} (${camposForm.anoLetivo})`
            : `${anoSerie.nome} (${camposForm.anoLetivo})`;

        return nome;
    };

    // Valida todos os campos do formulário
    const validaFormulario = () => {
        const errosForm = {};

        if (!camposForm.anoSerieId) {
            errosForm.anoSerieId = 'Ano/Série é obrigatório';
        }

        if (!camposForm.anoLetivo.trim()) {
            errosForm.anoLetivo = 'Ano letivo é obrigatório';
        } else {
            const anoNum = parseInt(camposForm.anoLetivo);
            if (isNaN(anoNum) || anoNum < 2000 || anoNum > 2100) {
                errosForm.anoLetivo = 'Ano letivo inválido';
            }
        }

        if (camposForm.letra.trim() && !/^[A-Za-z]$/.test(camposForm.letra.trim())) {
            errosForm.letra = 'Letra deve ser um único caractere de A a Z';
        }

        if (!camposForm.periodo) {
            errosForm.periodo = 'Período é obrigatório';
        }

        setErrors(errosForm);
        return Object.keys(errosForm).length === 0;
    };

    // Verifica se houve mudança nos dados
    const verificaMudanca = () => {
        if (!prevUpdate) return true;

        for (let campo in camposForm) {
            if (camposForm[campo] !== prevUpdate[campo]) {
                return true;
            }
        }
        return false;
    };

    // Atualiza campos do formulário
    const mudaFormulario = (e) => {
        const { name, value } = e.target;

        // Letra: aceita apenas um caractere e converte para maiúscula
        let valorFormatado = value;
        if (name === 'letra') {
            valorFormatado = value.slice(-1).toUpperCase();
        }

        setCamposForm((prev) => ({
            ...prev,
            [name]: valorFormatado,
        }));

        // Remove erro do campo quando usuário começa a editar
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    // Envia formulário
    const enviaFormulario = async (e) => {
        e.preventDefault();

        // Valida formulário
        if (!validaFormulario()) {
            setMensagem({
                tipo: 'error',
                texto: 'Corrija os erros no formulário.',
            });
            return;
        }

        if (editaTurma && !verificaMudanca()) {
            setMensagem({
                tipo: 'error',
                texto: 'Nenhuma alteração foi feita.',
            });
            return;
        }

        setLoading(true);
        setMensagem({ tipo: '', texto: '' });

        try {
            const dadosParaEnviar = {
                anoSerieId: camposForm.anoSerieId,
                letra: camposForm.letra.trim().toUpperCase() || null,
                anoLetivo: parseInt(camposForm.anoLetivo),
                periodo: camposForm.periodo,
            };

            if (editaTurma) {
                // Atualiza turma existente
                await api.put(`/turmas/${id}`, dadosParaEnviar);
                setMensagem({
                    tipo: 'success',
                    texto: 'Turma atualizada',
                });
            } else {
                // Cria nova turma
                await api.post('/turmas', dadosParaEnviar);
                setMensagem({
                    tipo: 'success',
                    texto: 'Turma cadastrada',
                });
            }

            // Redireciona
            setTimeout(() => {
                navigate('/turmas');
            }, 2000);
        } catch (error) {
            console.error('Erro ao salvar turma:', error);
            const mensagemErro = error.response?.data?.mensagem || 'Erro ao salvar turma. Tente novamente.';
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
        navigate('/turmas');
    };

    // Loading
    if (loadingForm) {
        return (
            <div className="content">
                <div className="loading">Carregando dados da turma...</div>
            </div>
        );
    }

    const previewNome = geraPreviewNome();

    return (
        <div className="content">
            {/* Header */}
            <div className="content-header">
                <h1 className="content-title">{editaTurma ? 'Editar Turma' : 'Cadastrar Turma'}</h1>
            </div>

            {/* Mensagem de Feedback */}
            {mensagem.texto && <div className={`alert alert-${mensagem.tipo}`}>{mensagem.texto}</div>}

            {/* Formulário */}
            <div className="form-container">
                <form onSubmit={enviaFormulario} noValidate>
                    <div className="form-grid-2">
                        {/* Ano/Série */}
                        <div className="input-group">
                            <label className="input-label input-label-required" htmlFor="anoSerieId">
                                Ano / Série
                            </label>
                            <select
                                id="anoSerieId"
                                name="anoSerieId"
                                className={`input-select ${errors.anoSerieId ? 'input-error' : ''} ${!camposForm.anoSerieId ? 'placeholder-active' : ''}`}
                                value={camposForm.anoSerieId}
                                onChange={mudaFormulario}
                                disabled={loading}
                            >
                                <option value="">Selecione o ano/série...</option>
                                {anosSeries.map((anoSerie) => (
                                    <option key={anoSerie.id} value={anoSerie.id}>
                                        {anoSerie.nome} — {anoSerie.etapa}
                                    </option>
                                ))}
                            </select>
                            {errors.anoSerieId && <span className="message-error">{errors.anoSerieId}</span>}
                        </div>

                        {/* Letra */}
                        <div className="input-group">
                            <label className="input-label" htmlFor="letra">
                                Letra da Turma
                            </label>
                            <input
                                type="text"
                                id="letra"
                                name="letra"
                                className={`input-field ${errors.letra ? 'input-error' : ''}`}
                                placeholder="Ex: A, B, C... (opcional)"
                                value={camposForm.letra}
                                onChange={mudaFormulario}
                                maxLength="1"
                                disabled={loading}
                            />
                            {errors.letra && <span className="message-error">{errors.letra}</span>}
                        </div>

                        {/* Ano Letivo */}
                        <div className="input-group">
                            <label className="input-label input-label-required" htmlFor="anoLetivo">
                                Ano Letivo
                            </label>
                            <input
                                type="number"
                                id="anoLetivo"
                                name="anoLetivo"
                                className={`input-field ${errors.anoLetivo ? 'input-error' : ''}`}
                                placeholder="Ex: 2026"
                                value={camposForm.anoLetivo}
                                onChange={mudaFormulario}
                                step="1"
                                min="2000"
                                max="2100"
                                disabled={loading}
                            />
                            {errors.anoLetivo && <span className="message-error">{errors.anoLetivo}</span>}
                        </div>

                        {/* Período */}
                        <div className="input-group">
                            <label className="input-label input-label-required" htmlFor="periodo">
                                Período
                            </label>
                            <select
                                id="periodo"
                                name="periodo"
                                className={`input-select ${errors.periodo ? 'input-error' : ''} ${!camposForm.periodo ? 'placeholder-active' : ''}`}
                                value={camposForm.periodo}
                                onChange={mudaFormulario}
                                disabled={loading}
                            >
                                <option value="">Selecione o período...</option>
                                <option value="MATUTINO">Matutino</option>
                                <option value="VESPERTINO">Vespertino</option>
                                <option value="NOTURNO">Noturno</option>
                            </select>
                            {errors.periodo && <span className="message-error">{errors.periodo}</span>}
                        </div>

                        {/* Preview do nome */}
                        <div className="input-group">
                            <label className="input-label">Preview do Nome</label>
                            <div
                                className={`input-field ${!previewNome ? 'placeholder-active' : ''}`}
                                style={{
                                    cursor: 'default',
                                    backgroundColor: '#f8f9fa',
                                    color: previewNome ? '#2c3e50' : '#adb5bd',
                                }}
                            >
                                {previewNome || 'Preencha Ano/Série e Ano Letivo para visualizar...'}
                            </div>
                        </div>
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
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Salvando...' : 'Salvar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FormularioTurma;
