const app = require('./app');
const dotenv = require('dotenv');

dotenv.config();

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Servidor] API rodando com sucesso na porta ${PORT}`);
  console.log(`[Healthcheck Local] Acesse http://localhost:${PORT}/health`);
  console.log(`[Healthcheck Rede Wi-Fi] Acesse http://192.168.1.102:${PORT}/health`);
});
