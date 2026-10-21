const express = require('express');
const filterController = require('../controllers/filterController');

const router = express.Router();

router.get('/subjects', filterController.getSubjects);
router.get('/vestibulares', filterController.getVestibulares);
router.get('/years', filterController.getYears);

module.exports = router;
