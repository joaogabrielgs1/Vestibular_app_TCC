function errorMiddleware(err, req, res, next) {
  console.error('Erro interno do servidor:', err);

  const status = err.statusCode || 500;
  const message = err.message || 'Ocorreu um erro interno no servidor.';

  res.status(status).json({
    error: message
  });
}

module.exports = errorMiddleware;
