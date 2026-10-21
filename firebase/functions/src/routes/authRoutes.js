'use strict';
const router = require('express').Router();
const c = require('../controllers/authController');

router.post('/register',  c.register);
router.post('/login',     c.login);

// Rotas autenticadas (middleware aplicado no index.js por prefixo, mas auth usa rotas mistas)
const auth = require('../middlewares/authMiddleware');
router.get('/profile',    auth, c.getProfile);
router.put('/email',      auth, c.updateEmail);
router.put('/password',   auth, c.updatePassword);
router.delete('/account', auth, c.deleteAccount);

module.exports = router;
