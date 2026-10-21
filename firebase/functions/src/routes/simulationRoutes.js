'use strict';
const router = require('express').Router();
const c = require('../controllers/simulationController');

router.post('/',            c.create);
router.get('/active',       c.getActive);
router.get('/history',      c.getHistory);
router.post('/:id/answer',  c.saveAnswer);
router.post('/:id/finish',  c.finish);
router.get('/:id/result',   c.getResult);

module.exports = router;
