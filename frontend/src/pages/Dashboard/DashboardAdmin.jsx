import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const DashboardAdmin = () => {
    const [stats, setStats] = useState({
        totalAlunos: 0,
        totalTurmas: 0,
        totalProfessores: 0,
    });
    const [turmas, setTurmas] = useState([]);
    const [semTurma, setSemTurma] = useState({ ativos: 0, inativos: 0 });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchDados();
    }, []);

    const fetchDados = async () => {
        try {
            setLoading(true);
            setError('');

            const [respStats, respTurmas, respSemTurmaAtivos, respSemTurmaInativos] = await Promise.all([
                api.get('/dashboard/stats'),
                api.get('/turmas', {
                    params: { status: 'ativo', ordenarPor: 'anoSerie', ordem: 'asc', limit: 200 },
                }),
                api.get('/alunos', { params: { turmaId: 'null', status: 'ativo', limit: 1 } }),
                api.get('/alunos', { params: { turmaId: 'null', status: 'inativo', limit: 1 } }),
            ]);

            setStats(respStats.data.dados);
            setTurmas(respTurmas.data.dados.turmas || []);
            setSemTurma({
                ativos: respSemTurmaAtivos.data.dados.paginacao.total,
                inativos: respSemTurmaInativos.data.dados.paginacao.total,
            });
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

    const tabelaVazia = turmas.length === 0 && semTurma.ativos === 0 && semTurma.inativos === 0;

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
                    <p className="card-stats-number">{stats.totalProfessores}</p>
                </div>
            </div>

            <div className="card" style={{ marginTop: '30px' }}>
                <div className="card-header">
                    <h2 className="card-section-title">📊 Alunos por Turma</h2>
                </div>

                {tabelaVazia ? (
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
                                <tr>
                                    <td data-label="Turma">Sem Turma</td>
                                    <td data-label="Etapa">-</td>
                                    <td data-label="Período">-</td>
                                    <td data-label="Ativos">{semTurma.ativos}</td>
                                    <td data-label="Inativos">{semTurma.inativos}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DashboardAdmin;
