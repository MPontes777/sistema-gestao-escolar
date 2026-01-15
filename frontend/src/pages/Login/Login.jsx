import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../../services/api';
import './Login.css';

const Login = () => {
    const navigate = useNavigate();

    // Estados do formulário
    const [formData, setFormData] = useState({
        email: '',
        senha: ''
    });

    // Estados de controle
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [alertMessage, setAlertMessage] = useState({ type: '', message: '' });

    // Atualiza os campos do formulário
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Limpa erro do campo quando usuário começa a digitar
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }

        // Limpa mensagem de alerta
        if (alertMessage.message) {
            setAlertMessage({ type: '', message: '' });
        }
    };

    // Valida formulário antes de enviar para o servidor
    const validateForm = () => {
        const newErrors = {};

        // Valida e-mail
        if (!formData.email.trim()) {
            newErrors.email = 'O e-mail é obrigatório';
        // /^ --> Inicia regex
        // [^\s@]+ --> um ou mais caracteres quem não sejam epaço ou arroba (por conta da negação !)
        // /^ --> Finaliza regex
        // .test --> retorna true ou false
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Digite um e-mail válido';
        }

        // Valida senha
        if (!formData.senha) {
            newErrors.senha = 'A senha é obrigatória';
        // Após a fase do MVP solicitar uma senha com letras e números, pelo menos uma letra maiúscula e um caractere especial
        } else if (formData.senha.length < 8) {
            newErrors.senha = 'A senha deve ter no mínimo 8 caracteres';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Submete formulário
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validar antes de enviar
        if (!validateForm()) {
            return;
        }

        // Prepara envio
        setLoading(true);
        setAlertMessage({ type: '', message: '' });

        try {
            // Chama API de login
            const response = await login(formData.email, formData.senha);

            // Salva token e dados do usuário no localStorage
            localStorage.setItem('token', response.token);
            localStorage.setItem('user', JSON.stringify(response.usuario));

            // Mensagem de sucesso
            setAlertMessage({
                type: 'success', 
                message: `Bem-vindo(a), ${response.usuario.nome}!`
            });

            // Aguarda 1 segundo antes de redirecionar
            setTimeout(() => {
                // Redireciona de acordo com o perfil do usuário
                const perfil = response.usuario.perfil?.toLowerCase();
                if (perfil === 'admin') {
                    navigate('/dashboard-admin');
                } else if (perfil === 'professor') {
                    navigate('/dashboard-admin');
                // Alterar após fase de MVP
                } else {
                    navigate('/dashboard');
                }
            }, 1000);

        } catch (error) {
            console.error('Erro ao fazer login:', error);

            // Trata erros
            if (error.response) {
                // Erro vindo do servidor
                setAlertMessage({
                    type: 'error', 
                    message: error.response.data.mensagem || 'Erro ao fazer login. Verifique suas credenciais.' 
                });
            } else if (error.request) {
                // Servidor não respondeu
                setAlertMessage({
                    type: 'error',
                    message: 'Não foi possível conectar ao servidor. Verifique sua conexão.' 
                });
            } else {
                // Outro tipo de erro
                setAlertMessage({
                    type: 'error',
                    message: 'Ocorreu um erro inesperado. Tente novamente.' 
                });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <h1>Sistema Integrado de Gestão Escolar</h1>
                    <p>Faça o login para continuar</p>
                </div>

                {/*Mensagem de alerta para sucesso ou erro*/}
                {alertMessage.message && (
                    <div className={`alert alert-${alertMessage.type}`}>
                        {alertMessage.message}
                    </div>
                )}

                <form className="login-form" onSubmit={handleSubmit} /*autoComplete="off"*/>
                    {/*E-Mail */}
                    <div className="form-group">
                        <label htmlFor="email">E-Mail</label>
                        <input
                            type="text"
                            id="email"
                            name="email"
                            placeholder="email@escola.com"
                            value={formData.email}
                            onChange={handleChange}
                            className={errors.email ? 'error' : ''}
                            disabled={loading}
                        />
                        {errors.email && (
                            <span className="error-message">{errors.email}</span>
                        )}
                    </div>

                    {/*Senha*/}
                    <div className="form-group">
                        <label htmlFor="senha">Senha</label>
                        <input
                            type="password"
                            id="senha"
                            name="senha"
                            placeholder="••••••••"
                            value={formData.senha}
                            onChange={handleChange}
                            className={errors.senha ? 'error' : ''}
                            disabled={loading}
                        />
                        {errors.senha && (
                            <span className="error-message">{errors.senha}</span>
                        )}
                    </div>

                    {/*Botão de Login*/}
                    <button 
                        type="submit" 
                        className="login-button"
                        disabled={loading}
                    >
                    {loading ? (
                        <>
                            <span className="loading-spinner"></span>
                            Entrando...
                        </>
                    ) : (
                        'Entrar'
                    )}
                    </button>
                </form>

                {/*Esqueci a senha --> Implementar após a fase de MVP*/}
                <div className="forgot-password">
                    <a href="#forgot">Esqueci a senha</a>
                </div>
            </div>
        </div>
    );
};

export default Login;