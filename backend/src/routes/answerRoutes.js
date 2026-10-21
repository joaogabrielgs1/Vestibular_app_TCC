const express = require('express');
const answerController = require('../controllers/answerController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/', authMiddleware, answerController.submitAnswer);
router.get('/history', authMiddleware, answerController.getHistory);
router.get('/statistics', authMiddleware, answerController.getStatistics);
router.get('/subject/:subjectId', authMiddleware, answerController.getSubjectQuestions);

module.exports = router;
