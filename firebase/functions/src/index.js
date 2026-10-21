/**
 * =============================================================================
 * VESTIBULAR APP — BACK-END FIREBASE (BaaS)
 * TCC — Comparativo de Arquiteturas: MVC vs BaaS (ISO/IEC 25010)
 * =============================================================================
 *
 * Ponto de entrada da Cloud Function HTTP.
 * Toda a lógica de roteamento é delegada ao Express (mesmo padrão do back-end MVC),
 * permitindo comparação justa dos dois paradigmas.
 *
 * Arquitetura:
 *   Android App → Cloud Function HTTP (Express) → Cloud Firestore
 *
 * Endpoints expostos sob /api/ (idênticos ao back-end MVC Node.js + MySQL):
 *   POST   /api/auth/register
 *   POST   /api/auth/login
 *   GET    /api/auth/profile
 *   PUT    /api/auth/email
 *   PUT    /api/auth/password
 *   DELETE /api/auth/account
 *   GET    /api/filters/subjects
 *   GET    /api/filters/vestibulares
 *   GET    /api/filters/years
 *   GET    /api/questions
 *   GET    /api/questions/:id
 *   POST   /api/answers
 *   GET    /api/answers/history
 *   GET    /api/answers/statistics
 *   GET    /api/answers/subject/:subjectId
 *   POST   /api/simulations
 *   GET    /api/simulations/active
 *   POST   /api/simulations/:id/answer
 *   POST   /api/simulations/:id/finish
 *   GET    /api/simulations/:id/result
 *   GET    /api/simulations/history
 *   GET    /health
 */

'use strict';

const functions = require('firebase-functions');
const admin     = require('firebase-admin');
const express   = require('express');

// Inicializa o Firebase Admin SDK (usa credenciais do ambiente automaticamente)
admin.initializeApp();

const app = express();
app.use(express.json());

// Expõe o objeto db (Firestore) globalmente para os controllers
global.db = admin.firestore();

// ---------------------------  Middlewares  ---------------------------
const authMiddleware = require('./middlewares/authMiddleware');

// ---------------------------  Rotas  --------------------------------
const authRoutes       = require('./routes/authRoutes');
const filterRoutes     = require('./routes/filterRoutes');
const questionRoutes   = require('./routes/questionRoutes');
const answerRoutes     = require('./routes/answerRoutes');
const simulationRoutes = require('./routes/simulationRoutes');

// Health check (medido como "cenário basal" no benchmark)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Firebase API de Vestibulares online.' });
});

app.use('/api/auth',        authRoutes);
app.use('/api/filters',     filterRoutes);
app.use('/api/questions',   authMiddleware, questionRoutes);
app.use('/api/answers',     authMiddleware, answerRoutes);
app.use('/api/simulations', authMiddleware, simulationRoutes);

// Handler centralizado de erros
app.use((err, req, res, _next) => {
  console.error('[Firebase API Error]', err);
  res.status(err.status || 500).json({ error: err.message || 'Erro interno do servidor.' });
});

// Exporta como Cloud Function HTTP (nome "api" é o caminho no emulador)
exports.api = functions.https.onRequest(app);
