'use strict';
const router = require('express').Router();
const c = require('../controllers/filterController');

router.get('/subjects',     c.getSubjects);
router.get('/vestibulares', c.getVestibulares);
router.get('/years',        c.getYears);

module.exports = router;
