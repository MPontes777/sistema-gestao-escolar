import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const DashboardAdmin = () => {
    const [stats, setStats] = useState({
        totalAlunos: 0,
        totalTurmas: 0,
        totalProfessores: 0,
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
            <div className="content">
                <div className="loading">Carregando estatísticas...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="content">
                <div className="error">{error}</div>
            </div>
        );
    }

    return (
        <div className="content">
            <div className="content-header">
                <h1 className="content-title">Bem-Vindo!</h1>
            </div>
            <div className="cards-container">
                <div className="card-stats">
                    <p className="card-stats-label">Total de Alunos</p>
                    <p className="card-stats-number">{stats.totalAlunos}</p>
                </div>
                <div className="card-stats">
                    <p className="card-stats-label">Total de Turmas</p>
                    <p className="card-stats-number">{stats.totalTurmas}</p>
                </div>
                <div className="card-stats">
                    <p className="card-stats-label">Total de Professores</p>
                    <p className="card-stats-number">
                        {stats.totalProfessores}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default DashboardAdmin;
