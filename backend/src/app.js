const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const responseTime = require('response-time');
const path = require('path');
const routes = require('./routes');
const errorMiddleware = require('./middlewares/errorMiddleware');

const app = express();

// Proteção de cabeçalhos HTTP (ISO/IEC 25010 - Segurança)
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Medição do tempo de processamento interno do servidor (ISO/IEC 25010 - Desempenho)
app.use(responseTime());

app.use(cors());
app.use(express.json());

// Servir arquivos de upload estáticos (imagens de questões)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rota de checagem de saúde da API
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'API de Vestibulares online.' });
});

// Agrupamento dos endpoints da API
app.use('/api', routes);

// Middleware centralizado de tratamento de erros
app.use(errorMiddleware);

module.exports = app;
