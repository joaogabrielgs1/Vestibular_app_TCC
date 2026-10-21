'use strict';
const router = require('express').Router();
const c = require('../controllers/answerController');

router.post('/',                    c.submitAnswer);
router.get('/history',              c.getHistory);
router.get('/statistics',           c.getStatistics);
router.get('/subject/:subjectId',   c.getSubjectQuestions);

module.exports = router;
