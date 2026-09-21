const express = require('express');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const disciplinasRoutes = require('./routes/disciplinas');
const modulosRoutes = require('./routes/modulos');
const aulasRoutes = require('./routes/aulas');
const perguntasRoutes = require('./routes/perguntas');
const quizRoutes = require('./routes/quiz');
const progressoRoutes = require('./routes/progresso');
const rankingRoutes = require('./routes/ranking');

const app = express();

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/disciplinas', disciplinasRoutes);
app.use('/api/modulos', modulosRoutes);
app.use('/api/aulas', aulasRoutes);
app.use('/api/perguntas', perguntasRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/progresso', progressoRoutes);
app.use('/api/ranking', rankingRoutes);

app.get('/', (req, res) => {
  res.json({
    status: 'API História rodando',
    endpoints: {
      auth: '/api/auth',
      disciplinas: '/api/disciplinas',
      modulos: '/api/modulos',
      aulas: '/api/aulas',
      perguntas: '/api/perguntas',
      quiz: '/api/quiz',
      progresso: '/api/progresso',
      ranking: '/api/ranking'
    }
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
