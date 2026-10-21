const subjectModel = require('../models/subjectModel');
const vestibularModel = require('../models/vestibularModel');

const filterController = {
  async getSubjects(req, res, next) {
    try {
      const subjects = await subjectModel.findAll();
      return res.status(200).json(subjects);
    } catch (error) {
      next(error);
    }
  },

  async getVestibulares(req, res, next) {
    try {
      const vestibulares = await vestibularModel.findAll();
      return res.status(200).json(vestibulares);
    } catch (error) {
      next(error);
    }
  },

  async getYears(req, res, next) {
    try {
      const years = await vestibularModel.findDistinctYears();
      return res.status(200).json(years);
    } catch (error) {
      next(error);
    }
  }
};

module.exports = filterController;
