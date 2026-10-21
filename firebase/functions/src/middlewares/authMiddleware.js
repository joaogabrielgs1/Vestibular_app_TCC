/**
 * Middleware de Autenticação JWT — Firebase Back-end (BaaS)
 *
 * Verifica o token Bearer em todas as rotas protegidas.
 * Idêntico ao authMiddleware do back-end MVC — garante paridade de segurança.
 */

'use strict';

const jwt = require('jsonwebtoken');

module.exports = function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de autenticação não fornecido.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const secret = process.env.JWT_SECRET || functions_config_jwt_secret();
    const decoded = jwt.verify(token, secret);
    req.user = decoded; // { id, email, iat, exp }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
};

/**
 * Lê o JWT secret das variáveis de ambiente do Firebase Functions.
 * Configura com: firebase functions:config:set jwt.secret="..."
 */
function functions_config_jwt_secret() {
  try {
    const functions = require('firebase-functions');
    return functions.config().jwt.secret;
  } catch {
    return 'vestibular_tcc_super_jwt_secret_key_2026';
  }
}
