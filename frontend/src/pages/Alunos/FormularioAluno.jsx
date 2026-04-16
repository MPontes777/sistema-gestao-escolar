import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';

const FormularioAluno = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const editaAluno = !!id;

    // Estados
    const [camposForm, setCamposForm] = useState({
        nome: '',
        dataNascimento: '',
        cpf: '',
        email: '',
        nomeResponsavel: '',
        telefone: '',
        endereco: '',
        turmaId: '',
    });
    const [turmas, setTurmas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingForm, setLoadingForm] = useState(false);
    const [errors, setErrors] = useState({});
    const [mensagem, setMensagem] = useState({ tipo: '', texto: '' });
    const [prevUpdate, setPrevUpdate] = useState(null);

    // Carrega dados
    useEffect(() => {
        carregaTurmas();
        if (editaAluno) {
            carregaDadosAluno();
        }
    }, [id]);

    // Carrega lista de turmas ativas
    const carregaTurmas = async () => {
        try {
            const response = await api.get('/turmas?status=ativo&ordenarPor=anoSerie&ordem=asc');
            setTurmas(response.data.dados?.turmas || []);
        } catch (error) {
            console.error('Erro ao carregar turmas:', error);
            setMensagem({
                tipo: 'error',
                texto: 'Erro ao carregar turmas. Tente novamente.',
            });
        }
    };

    // Carrega dados do aluno
    const carregaDadosAluno = async () => {
        setLoadingForm(true);
        try {
            const response = await api.get(`/alunos/${id}`);
            const aluno = response.data.dados;

            // Formata data
            const dataFormatada = aluno.dataNascimento
                ? new Date(aluno.dataNascimento).toISOString().split('T')[0]
                : '';

            const dadosForm = {
                nome: aluno.nome || '',
                dataNascimento: dataFormatada,
                cpf: mascaraCPF(aluno.cpf || ''),
                email: aluno.email || '',
                nomeResponsavel: aluno.nomeResponsavel || '',
                telefone: mascaraTelefone(aluno.telefone || ''),
                endereco: aluno.endereco || '',
                turmaId: aluno.turmaId || '',
            };

            setCamposForm(dadosForm);
            setPrevUpdate(dadosForm);
        } catch (error) {
            console.error('Erro ao carregar aluno:', error);
            setMensagem({
                tipo: 'error',
                texto: 'Erro ao carregar dados do aluno.',
            });
        } finally {
            setLoadingForm(false);
        }
    };

    // Máscara de CPF: 123.456.789-01
    const mascaraCPF = (value) => {
        const numeros = value.replace(/\D/g, '');
        if (numeros.length <= 11) {
            return numeros
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        }
        return value;
    };

    // Máscara de telefone: (11) 98765-4321
    const mascaraTelefone = (value) => {
        const numeros = value.replace(/\D/g, '');
        if (numeros.length <= 11) {
            return numeros.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
        }
        return value;
    };

    // Valida data de nascimento
    const validaDataNascimento = (data) => {
        if (!data) return false;

        const dataNasc = new Date(data);
        const hoje = new Date();

        // Verifica se é uma data válida
        if (isNaN(dataNasc.getTime())) return false;

        // Não pode ser futura
        if (dataNasc > hoje) return false;

        return true;
    };

    // Valida CPF (verifica se tem 11 dígitos)
    const validaCPF = (cpf) => {
        const numeros = cpf.replace(/\D/g, '');
        return numeros.length === 11;
    };

    // Valida formato de email
    const validaEmail = (email) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    };

    // Valida telefone
    const validaTelefone = (telefone) => {
        const numeros = telefone.replace(/\D/g, '');
        return numeros.length === 10 || numeros.length === 11;
    };

    // Valida todos os campos do formulário
    const validaFormulario = () => {
        const errosForm = {};

        if (!camposForm.nome.trim()) {
            errosForm.nome = 'Nome completo é obrigatório';
        }

        if (!camposForm.dataNascimento) {
            errosForm.dataNascimento = 'Data de nascimento é obrigatória';
        } else if (!validaDataNascimento(camposForm.dataNascimento)) {
            errosForm.dataNascimento = 'Data de nascimento inválida';
        }

        if (!camposForm.cpf.trim()) {
            errosForm.cpf = 'CPF é obrigatório';
        } else if (!validaCPF(camposForm.cpf)) {
            errosForm.cpf = 'CPF deve conter 11 dígitos';
        }

        if (camposForm.email.trim() && !validaEmail(camposForm.email)) {
            errosForm.email = 'Email inválido';
        }

        if (!camposForm.nomeResponsavel.trim()) {
            errosForm.nomeResponsavel = 'Nome do responsável é obrigatório';
        }

        if (camposForm.telefone.trim() && !validaTelefone(camposForm.telefone)) {
            errosForm.telefone = 'Telefone inválido';
        }

        setErrors(errosForm);
        return Object.keys(errosForm).length === 0;
    };

    // Atualiza campos do formulário
    const mudaFormulario = (e) => {
        const { name, value } = e.target;

        // Aplica máscara conforme o campo
        let valorFormatado = value;

        if (name === 'cpf') {
            valorFormatado = mascaraCPF(value);
        } else if (name === 'telefone') {
            valorFormatado = mascaraTelefone(value);
        }

        setCamposForm((prev) => ({
            ...prev,
            [name]: valorFormatado,
        }));

        // Remove erro do campo quando usuário começa a digitar
        if (errors[name]) {
            setErrors((prev) => ({
                ...prev,
                [name]: '',
            }));
        }
    };

    // Verifica se houve mudança nos dados
    const verificaMudanca = () => {
        if (!prevUpdate) return true;

        // Compara cada campo
        for (let campo in camposForm) {
            let valorAtual = camposForm[campo];
            let valorOriginal = prevUpdate[campo];

            // Remove máscaras
            if (campo === 'cpf' || campo === 'telefone') {
                valorAtual = valorAtual.replace(/\D/g, '');
                valorOriginal = valorOriginal.replace(/\D/g, '');
            }

            if (valorAtual !== valorOriginal) {
                return true;
            }
        }
        return false;
    };

    // Envia Formulário
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

        if (editaAluno && !verificaMudanca()) {
            setMensagem({
                tipo: 'error',
                texto: 'Nenhuma alteração foi feita',
            });
            return;
        }

        setLoading(true);
        setMensagem({ tipo: '', texto: '' });

        try {
            const dadosParaEnviar = {
                nome: camposForm.nome.trim(),
                dataNascimento: camposForm.dataNascimento,
                cpf: camposForm.cpf.replace(/\D/g, ''), // Remove máscara
                email: camposForm.email.trim(),
                nomeResponsavel: camposForm.nomeResponsavel.trim(),
                telefone: camposForm.telefone.replace(/\D/g, ''), // Remove máscara
                endereco: camposForm.endereco.trim(),
                turmaId: camposForm.turmaId,
            };

            if (editaAluno) {
                // Atualiza aluno existente
                await api.put(`/alunos/${id}`, dadosParaEnviar);
                setMensagem({
                    tipo: 'success',
                    texto: 'Aluno atualizado',
                });
            } else {
                // Cria novo aluno
                await api.post('/alunos', dadosParaEnviar);
                setMensagem({
                    tipo: 'success',
                    texto: 'Aluno cadastrado',
                });
            }

            // Redireciona
            setTimeout(() => {
                navigate('/alunos');
            }, 2000);
        } catch (error) {
            console.error('Erro ao salvar aluno:', error);
            const mensagemErro = error.response?.data?.mensagem || 'Erro ao salvar aluno. Tente novamente.';
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
        navigate('/alunos');
    };

    // Loading
    if (loadingForm) {
        return (
            <div className="content">
                <div className="loading">Carregando dados do aluno...</div>
            </div>
        );
    }

    return (
        <div className="content">
            {/* Header */}
            <div className="content-header">
                <h1 className="content-title">{editaAluno ? 'Editar Aluno' : 'Cadastrar Aluno'}</h1>
            </div>

            {/* Mensagem de Feedback */}
            {mensagem.texto && <div className={`alert alert-${mensagem.tipo}`}>{mensagem.texto}</div>}

            {/* Formulário */}
            <div className="form-container">
                <form onSubmit={enviaFormulario} noValidate>
                    <div className="form-grid-2">
                        <div className="input-group">
                            <label className="input-label input-label-required" htmlFor="nome">
                                Nome Completo
                            </label>
                            <input
                                type="text"
                                id="nome"
                                name="nome"
                                className={`input-field ${errors.nome ? 'input-error' : ''}`}
                                placeholder="Digite o nome completo..."
                                value={camposForm.nome}
                                onChange={mudaFormulario}
                                disabled={loading}
                            />
                            {errors.nome && <span className="message-error">{errors.nome}</span>}
                        </div>

                        <div className="input-group">
                            <label className="input-label input-label-required" htmlFor="dataNascimento">
                                Data de Nascimento
                            </label>
                            <input
                                type="date"
                                id="dataNascimento"
                                name="dataNascimento"
                                className={`input-field ${errors.dataNascimento ? 'input-error' : ''}`}
                                value={camposForm.dataNascimento}
                                onChange={mudaFormulario}
                                disabled={loading}
                            />
                            {errors.dataNascimento && <span className="message-error">{errors.dataNascimento}</span>}
                        </div>

                        <div className="input-group">
                            <label className="input-label input-label-required" htmlFor="cpf">
                                CPF
                            </label>
                            <input
                                type="text"
                                id="cpf"
                                name="cpf"
                                className={`input-field ${errors.cpf ? 'input-error' : ''}`}
                                placeholder="000.000.000-00"
                                value={camposForm.cpf}
                                onChange={mudaFormulario}
                                maxLength="14"
                                disabled={loading}
                            />
                            {errors.cpf && <span className="message-error">{errors.cpf}</span>}
                        </div>

                        <div className="input-group">
                            <label className="input-label" htmlFor="email">
                                E-Mail
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                className={`input-field ${errors.email ? 'input-error' : ''}`}
                                placeholder="exemplo@email.com"
                                value={camposForm.email}
                                onChange={mudaFormulario}
                                disabled={loading}
                            />
                            {errors.email && <span className="message-error">{errors.email}</span>}
                        </div>

                        <div className="input-group">
                            <label className="input-label input-label-required" htmlFor="nomeResponsavel">
                                Nome do Responsável
                            </label>
                            <input
                                type="text"
                                id="nomeResponsavel"
                                name="nomeResponsavel"
                                className={`input-field ${errors.nomeResponsavel ? 'input-error' : ''}`}
                                placeholder="Digite o nome do responsável"
                                value={camposForm.nomeResponsavel}
                                onChange={mudaFormulario}
                                disabled={loading}
                            />
                            {errors.nomeResponsavel && <span className="message-error">{errors.nomeResponsavel}</span>}
                        </div>

                        <div className="input-group">
                            <label className="input-label input-label-required" htmlFor="telefone">
                                Telefone do Responsável
                            </label>
                            <input
                                type="text"
                                id="telefone"
                                name="telefone"
                                className={`input-field ${errors.telefone ? 'input-error' : ''}`}
                                placeholder="(00) 00000-0000"
                                value={camposForm.telefone}
                                onChange={mudaFormulario}
                                maxLength="15"
                                disabled={loading}
                            />
                            {errors.telefone && <span className="message-error">{errors.telefone}</span>}
                        </div>

                        <div className="input-group">
                            <label className="input-label" htmlFor="endereco">
                                Endereço
                            </label>
                            <input
                                type="text"
                                id="endereco"
                                name="endereco"
                                className="input-field"
                                placeholder="Rua, número, bairro, cidade - UF"
                                value={camposForm.endereco}
                                onChange={mudaFormulario}
                                disabled={loading}
                            />
                        </div>

                        <div className="input-group">
                            <label className="input-label" htmlFor="turmaId">
                                Turma
                            </label>
                            <select
                                id="turmaId"
                                name="turmaId"
                                className={`input-select ${
                                    errors.turmaId ? 'input-error' : ''
                                } ${!camposForm.turmaId ? 'placeholder-active' : ''}`}
                                value={camposForm.turmaId}
                                onChange={mudaFormulario}
                                disabled={loading}
                            >
                                <option value="">Selecione uma turma</option>
                                {turmas.map((turma) => (
                                    <option key={turma.id} value={turma.id}>
                                        {turma.nomeCompleto} - {turma.periodo}
                                    </option>
                                ))}
                            </select>
                            {errors.turmaId && <span className="message-error">{errors.turmaId}</span>}
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

export default FormularioAluno;
