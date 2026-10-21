const express = require('express');
const simulationController = require('../controllers/simulationController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// Todas as rotas exigem autenticacao 
router.use(authMiddleware);

router.post('/', simulationController.create);
router.get('/active', simulationController.getActive);
router.get('/history', simulationController.getHistory);
router.get('/:id/result', simulationController.getResult);
router.post('/:id/answer', simulationController.saveAnswer);
router.post('/:id/finish', simulationController.finish);

module.exports = router;
