const express = require('express');
const questionController = require('../controllers/questionController');

const router = express.Router();

router.get('/', questionController.list);
router.get('/:id', questionController.getById);

module.exports = router;
