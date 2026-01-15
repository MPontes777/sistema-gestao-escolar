import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login/Login';
import DashboardAdmin from './pages/DashboardAdmin/DashboardAdmin';
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
      return <Navigate to="/dashboard-admin" />;
    }
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
              <DashboardAdmin />
            </PrivateRoute>
          } 
        />

        {/* Rota raiz - redireciona para login */}
        <Route 
          path="/" 
          element={<Navigate to="/login" />} 
        />

        {/* Rota 404 - redireciona para login */}
        <Route 
          path="*" 
          element={<Navigate to="/login" />} 
        />
      </Routes>
    </Router>
  );
}

export default App;