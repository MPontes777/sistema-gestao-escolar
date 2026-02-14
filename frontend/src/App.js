import React from 'react';
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate,
} from 'react-router-dom';
import Login from './pages/Login/Login';
import Layout from './components/Layout/Layout';
import DashboardAdmin from './pages/Dashboard/DashboardAdmin';
import DashboardProfessor from './pages/Dashboard/DashboardProfessor';
import ListaAlunos from './pages/Alunos/ListaAlunos';
import { isAuthenticated, getUser } from './services/api';

// Protege rotas privadas
const PrivateRoute = ({ children }) => {
    return isAuthenticated() ? children : <Navigate to="/login" />;
};

// Redireciona usuário autenticado
const PublicRoute = ({ children }) => {
    if (isAuthenticated()) {
        const user = getUser();
        const perfil = user?.perfil?.toLowerCase();
        if (perfil === 'admin') {
            return <Navigate to="/dashboard-admin" />;
        } else if (perfil === 'professor') {
            return <Navigate to="/dashboard-professor" />;
        }
    }
    return children;
};

// Protege rotas privadas para admin
const AdminRoute = ({ children }) => {
    if (!isAuthenticated()) {
        return <Navigate to="/login" />;
    }

    const user = getUser();
    if (user?.perfil !== 'admin') {
        return <Navigate to="/dashboard-professor" />;
    }

    return children;
};

function App() {
    return (
        <Router>
            <Routes>
                {/* Rota pública - Login */}
                <Route
                    path="/login"
                    element={
                        <PublicRoute>
                            <Login />
                        </PublicRoute>
                    }
                />

                {/* Rota privada - Dashboard Admin */}
                <Route
                    path="/dashboard-admin"
                    element={
                        <PrivateRoute>
                            <Layout>
                                <DashboardAdmin />
                            </Layout>
                        </PrivateRoute>
                    }
                />

                {/* Rota privada - Dashboard Professor */}
                <Route
                    path="/dashboard-professor"
                    element={
                        <PrivateRoute>
                            <Layout>
                                <DashboardProfessor />
                            </Layout>
                        </PrivateRoute>
                    }
                />

                {/* Rotas privadas para admin */}
                {/* Rota privada - Lista de Alunos */}
                <Route
                    path="/alunos"
                    element={
                        <AdminRoute>
                            <Layout>
                                <ListaAlunos />
                            </Layout>
                        </AdminRoute>
                    }
                />

                {/* Rota raiz - redireciona para login */}
                <Route path="/" element={<Navigate to="/login" />} />

                {/* Rota 404 - redireciona para login */}
                <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
        </Router>
    );
}

export default App;
