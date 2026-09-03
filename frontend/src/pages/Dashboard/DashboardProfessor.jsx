import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const DashboardProfessor = () => {
    const [stats, setStats] = useState({
        totalAlunos: 0,
        totalTurmas: 0,
    });
    const [turmas, setTurmas] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchDados();
    }, []);

    const fetchDados = async () => {
        try {
            setLoading(true);
            setError('');

            const [respStats, respTurmas] = await Promise.all([
                api.get('/dashboard/stats'),
                api.get('/turmas', {
                    params: { status: 'ativo', ordenarPor: 'anoSerie', ordem: 'asc', limit: 200 },
                }),
            ]);

            setStats(respStats.data.dados);
            setTurmas(respTurmas.data.dados.turmas || []);
        } catch (err) {
            console.error('Erro ao buscar informações:', err);
            setError('Erro ao carregar informações');
        } finally {
            setLoading(false);
        }
    };

    // Formata período
    const formataPeriodo = (periodo) => {
        if (!periodo) return '-';
        return periodo.charAt(0) + periodo.slice(1).toLowerCase();
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
            </div>

            <div className="card" style={{ marginTop: '30px' }}>
                <div className="card-header">
                    <h2 className="card-section-title">📊 Minhas Turmas</h2>
                </div>

                {turmas.length === 0 ? (
                    <div className="card-body">
                        <div className="empty">
                            <p>Nenhuma turma ativa encontrada.</p>
                        </div>
                    </div>
                ) : (
                    <div className="card-body" style={{ padding: 0 }}>
                        <table className="table table-dashboard-turmas">
                            <thead>
                                <tr>
                                    <th>Turma</th>
                                    <th>Etapa</th>
                                    <th>Período</th>
                                    <th>Ativos</th>
                                    <th>Inativos</th>
                                </tr>
                            </thead>
                            <tbody>
                                {turmas.map((t) => (
                                    <tr key={t.id}>
                                        <td data-label="Turma">{t.nomeCompleto}</td>
                                        <td data-label="Etapa">{t.anoSerie?.etapa}</td>
                                        <td data-label="Período">{formataPeriodo(t.periodo)}</td>
                                        <td data-label="Ativos">{t.alunos?.filter((a) => a.ativo).length ?? 0}</td>
                                        <td data-label="Inativos">{t.alunos?.filter((a) => !a.ativo).length ?? 0}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DashboardProfessor;
