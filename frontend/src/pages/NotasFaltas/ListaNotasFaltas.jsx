import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getUser } from '../../services/api';

const ListaNotasFaltas = () => {
    const navigate = useNavigate();
    const usuario = getUser();

    // Estados
    const [vinculos, setVinculos] = useState({ turmas: [], disciplinas: [], vinculos: [] });
    const [disciplinaId, setDisciplinaId] = useState('');
    const [turmasResumo, setTurmasResumo] = useState([]);
    const [loadingVinculos, setLoadingVinculos] = useState(true);
    const [loadingTurmas, setLoadingTurmas] = useState(false);
    const [erro, setErro] = useState(null);

    // Carrega disciplinas/turmas vinculadas ao usuário
    const carregaVinculos = async () => {
        try {
            setLoadingVinculos(true);
            setErro(null);

            const response = await api.get('/notas/vinculos');
            const dados = response.data.dados;
            setVinculos(dados);

            // Seleciona a primeira disciplina automaticamente
            if (dados.disciplinas.length > 0) {
                setDisciplinaId(dados.disciplinas[0].id);
            }
        } catch (error) {
            console.error('Erro ao buscar vínculos:', error);
            setErro('Erro ao carregar disciplinas disponíveis.');
        } finally {
            setLoadingVinculos(false);
        }
    };

    // Carrega o resumo de turmas da disciplina selecionada
    const carregaResumoTurmas = async (idDisciplina) => {
        try {
            setLoadingTurmas(true);
            setErro(null);

            const response = await api.get('/notas/resumo-turmas', {
                params: { disciplinaId: idDisciplina },
            });
            setTurmasResumo(response.data.dados);
        } catch (error) {
            console.error('Erro ao buscar resumo de turmas:', error);
            setErro('Erro ao carregar turmas. Tente novamente.');
        } finally {
            setLoadingTurmas(false);
        }
    };

    useEffect(() => {
        carregaVinculos();
    }, []);

    useEffect(() => {
        if (disciplinaId) {
            carregaResumoTurmas(disciplinaId);
        }
    }, [disciplinaId]);

    // Classe de cor da média geral
    const classeMedia = (mediaGeral) => {
        if (mediaGeral === null) return 'media-vazia';
        return mediaGeral >= 6.0 ? 'media-boa' : 'media-ruim';
    };

    // Texto de exibição da média geral
    const textoMedia = (mediaGeral) => {
        return mediaGeral === null ? '—' : mediaGeral.toFixed(1);
    };

    // Navega para a tela de lançamento (lista de alunos da turma)
    const navegaParaLancamento = (turmaId) => {
        navigate(`/notas-faltas/${turmaId}?disciplinaId=${disciplinaId}`);
    };

    // Só permite trocar quando o professor leciona mais de uma disciplina
    const seletorDesabilitado = loadingVinculos || vinculos.disciplinas.length <= 1;

    return (
        <div className="content">
            {/* Header */}
            <div className="content-header">
                <div className="titulo-com-seletor">
                    <h1 className="content-title">Lançar Notas e Faltas</h1>

                    <select
                        value={disciplinaId}
                        onChange={(e) => setDisciplinaId(e.target.value)}
                        className="disciplina-select"
                        disabled={seletorDesabilitado}
                    >
                        {vinculos.disciplinas.map((d) => (
                            <option key={d.id} value={d.id}>
                                {d.nome}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Loading inicial (vínculos) */}
            {loadingVinculos && (
                <div className="loading">
                    <div className="spinner-loading"></div>
                    <p>Carregando disciplinas...</p>
                </div>
            )}

            {/* Erro */}
            {erro && !loadingVinculos && (
                <div className="error">
                    <p>⚠️ {erro}</p>
                    <button onClick={carregaVinculos} className="btn btn-primary">
                        Tentar Novamente
                    </button>
                </div>
            )}

            {/* Sem nenhuma disciplina vinculada */}
            {!loadingVinculos && !erro && vinculos.disciplinas.length === 0 && (
                <div className="empty">
                    <p>Nenhuma disciplina vinculada.</p>
                </div>
            )}

            {/* Loading das turmas da disciplina selecionada */}
            {!loadingVinculos && !erro && vinculos.disciplinas.length > 0 && loadingTurmas && (
                <div className="loading">
                    <div className="spinner-loading"></div>
                    <p>Carregando turmas...</p>
                </div>
            )}

            {/* Grade de cards */}
            {!loadingVinculos && !erro && vinculos.disciplinas.length > 0 && !loadingTurmas && (
                <>
                    {turmasResumo.length === 0 ? (
                        <div className="empty">
                            <p>Nenhuma turma vinculada a esta disciplina.</p>
                        </div>
                    ) : (
                        <div className="turmas-resumo-container">
                            {turmasResumo.map((turma) => (
                                <div key={turma.turmaId} className="card-turma">
                                    <div className="card-turma-header">
                                        <h3>{turma.nomeCompleto}</h3>
                                        <p className="turma-etapa">{turma.etapa}</p>
                                    </div>

                                    <div className="card-turma-body">
                                        <div className="stat-block">
                                            <div className="stat-label">Alunos</div>
                                            <div className="stat-value">{turma.totalAlunos}</div>
                                        </div>
                                        <div className="stat-block">
                                            <div className="stat-label">Média Geral</div>
                                            <div className={`stat-value ${classeMedia(turma.mediaGeral)}`}>
                                                {textoMedia(turma.mediaGeral)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="card-turma-footer">
                                        <button
                                            onClick={() => navegaParaLancamento(turma.turmaId)}
                                            className="btn-lancar"
                                        >
                                            {usuario?.perfil === 'admin' ? 'Lançar Notas' : 'Lançar Notas e Faltas'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default ListaNotasFaltas;
