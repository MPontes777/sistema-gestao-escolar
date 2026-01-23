require('dotenv').config();

const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();
const PORT = process.env.PORT || 3000; // Porta do server em produção ou 3000 como porta local

app.use(cors());
app.use(express.json());

// Rotas
app.use('/auth', authRoutes);
app.use('/dashboard', dashboardRoutes);

// Rota teste
app.get('/', (req, res) => {
  res.json({ message: 'TCC Desenvolvimento Full Stack' });
});

// Roda teste com token
const { authenticateToken } = require('./middlewares/authMiddleware');
app.get('/teste-protegido', authenticateToken, (req, res) => {
  res.json ({
    message: 'Autenticado!',
    usuario: req.user
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Server rodando na porta ${PORT}`);
});