const express = require('express');
const authRoutes = require('./authRoutes');
const filterRoutes = require('./filterRoutes');
const questionRoutes = require('./questionRoutes');
const answerRoutes = require('./answerRoutes');
const simulationRoutes = require('./simulationRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/filters', filterRoutes);
router.use('/questions', questionRoutes);
router.use('/answers', answerRoutes);
router.use('/simulations', simulationRoutes);

module.exports = router;
