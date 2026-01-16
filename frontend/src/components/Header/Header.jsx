import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Header.css';

const Header = () => {
    const navigate = useNavigate();

    // Armazena dados do usuário do localStorage
    const user = JSON.parse(localStorage.getItem('user'));

    // Logout
    const handleLogout = () => {
        // Remove dados do localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Redireciona para a tela de login
        navigate('/login');
    };

    return (
        <header className="header">
            <div className="header-container">
                <div className="header-title">
                    <h1>Sistema Integrado de Gestão Escolar</h1>
                </div>
                <div className="header-action">
                    <span className="header-hello">
                        Olá, {user?.nome}
                    </span>
                    <button
                        className="header-logout-btn"
                        onClick={handleLogout}
                        title="Sair do sistema"
                    >
                        Sair
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;