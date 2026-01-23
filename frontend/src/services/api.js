import axios from 'axios';

// Configuração base do Axios
const api = axios.create({
    baseURL: 'http://localhost:3000',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Intercepta e adiciona token em todas as requisições
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Intercepta e trata os erros de resposta
api.interceptors.response.use(
    // Se a resposta for sucesso, retorna ela
    (response) => response,
    (error) => {
        // Se der erro 401 ou não estiver direcionando
        if ((error.response?.status === 401 || error.response?.status === 403) && localStorage.getItem('token')) {
            // Limpa Local Storage e redireciona
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
    return Promise.reject(error);
    }
);

// Login
const login = async (email, senha) => {
    try {
        const response = await api.post('/auth/login', { email, senha });
        return response.data;
    } catch (error) {
        throw error;
    }
};

// Logout
const logout = async () => {
    try {
        await api.post('/auth/logout');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    // Garante logout
    } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }
};

// Verifica se usuário está autenticado
const isAuthenticated = () => {
    return !!localStorage.getItem('token');
};

// Obtém dados do usuário
const getUser = () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
};

export { login, logout, isAuthenticated, getUser };
export default api;