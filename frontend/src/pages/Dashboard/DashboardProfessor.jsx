import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './Dashboard.css';

const DashboardProfessor = () => {
    const [stats, setStats] = useState({
        totalAlunos: 0,
        totalTurmas: 0
    });
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            setError('');

            const response = await api.get('/dashboard/stats');

            setStats(response.data);
        } catch (err) {
            console.error('Erro ao buscar informações:', err);
            setError('Erro ao carregar informações');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="dashboard">
                <div className="loading">Carregando...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="dashboard">
                <div className="error">{error}</div>
            </div>
        );
    }

    return (
        <div className="dashboard">
            <h1 className="dashboard-title">Bem-Vindo!</h1>
            <div className="cards-container">
                <div className="card-box">
                    <p className="card-label">Total de Alunos</p>
                    <p className="card-number">{stats.totalAlunos}</p>
                </div>
                <div className="card-box">
                    <p className="card-label">Total de Turmas</p>
                    <p className="card-number">{stats.totalTurmas}</p>
                </div>
            </div>
        </div>
    );
};

export default DashboardProfessor;