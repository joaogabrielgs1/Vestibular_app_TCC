const express = require('express');
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/profile', authMiddleware, authController.getProfile);
router.put('/profile', authMiddleware, authController.updateProfile);
router.put('/email', authMiddleware, authController.updateEmail);
router.put('/password', authMiddleware, authController.updatePassword);
router.delete('/account', authMiddleware, authController.deleteAccount);

module.exports = router;
