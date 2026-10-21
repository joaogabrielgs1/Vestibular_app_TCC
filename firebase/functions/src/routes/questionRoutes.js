'use strict';
const router = require('express').Router();
const c = require('../controllers/questionController');

router.get('/',    c.list);
router.get('/:id', c.getById);

module.exports = router;
