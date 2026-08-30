import React from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = () => {
    // Armazena perfil do usuário
    const user = JSON.parse(localStorage.getItem('user'));
    const userPerfil = user?.perfil || '';

    // Menu para cada perfil
    const menuItems = {
        admin: [
            { path: '/dashboard-admin', label: 'Dashboard', icon: '📊' },
            { path: '/alunos', label: 'Alunos', icon: '👥' },
            { path: '/turmas', label: 'Turmas', icon: '🏫' },
            { path: '/turmas-notas-faltas', label: 'Notas e Faltas', icon: '📝' },
            { path: '/planejamentos', label: 'Planejamentos', icon: '📅' },
        ],
        professor: [
            { path: '/dashboard-professor', label: 'Dashboard', icon: '📊' },
            { path: '/turmas-notas-faltas', label: 'Notas e Faltas', icon: '📝' },
            { path: '/planejamentos', label: 'Planejamentos', icon: '📅' },
        ],
    };

    // Muda o menu baseado no perfil
    const currentMenu = menuItems[userPerfil] || [];

    return (
        <aside className="sidebar">
            <nav className="sidebar-nav">
                <ul className="sidebar-menu">
                    {currentMenu.map((item) => (
                        <li key={item.path} className="sidebar-menu-item">
                            <NavLink
                                to={item.path}
                                className={({ isActive }) =>
                                    isActive ? 'sidebar-link sidebar-link-active' : 'sidebar-link'
                                }
                            >
                                <span className="sidebar-icon">{item.icon}</span>
                                <span className="sidebar-label">{item.label}</span>
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>
        </aside>
    );
};

export default Sidebar;
