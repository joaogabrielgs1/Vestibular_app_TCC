const questionModel = require('../models/questionModel');

const questionController = {
  async list(req, res, next) {
    try {
      const { subject_id, year, vestibular_id, page, limit } = req.query;

      const result = await questionModel.findFiltered({
        subjectId: subject_id,
        year,
        vestibularId: vestibular_id,
        page: page || 1,
        limit: limit || 10
      });

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const question = await questionModel.findById(id);

      if (!question) {
        return res.status(404).json({ error: 'Questão não encontrada.' });
      }

      return res.status(200).json(question);
    } catch (error) {
      next(error);
    }
  }
};

module.exports = questionController;
