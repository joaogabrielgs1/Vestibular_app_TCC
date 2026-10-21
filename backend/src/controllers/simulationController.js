const simulationModel = require('../models/simulationModel');

const simulationController = {
  /**
   * POST /api/simulations
   */
  async create(req, res, next) {
    try {
      const userId = req.user.id;
      const { title, subject_id, vestibular_id, year, limit } = req.body;

      const simulation = await simulationModel.createSimulation({
        userId,
        title,
        subjectId: subject_id,
        vestibularId: vestibular_id,
        year,
        limit: limit ? Number(limit) : 10
      });

      return res.status(201).json({
        message: 'Simulado iniciado com sucesso.',
        simulation
      });
    } catch (error) {
      if (error.message.includes('Nenhuma questão')) {
        return res.status(404).json({ error: error.message });
      }
      next(error);
    }
  },

  /**
   * GET /api/simulations/active
   */
  async getActive(req, res, next) {
    try {
      const userId = req.user.id;
      const activeSim = await simulationModel.getActiveSimulation(userId);

      if (!activeSim) {
        return res.status(200).json({ active: false, simulation: null });
      }

      return res.status(200).json({ active: true, simulation: activeSim });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/simulations/:id/answer
   */
  async saveAnswer(req, res, next) {
    try {
      const userId = req.user.id;
      const simulationId = req.params.id;
      const { question_id, alternative_id, current_question_index } = req.body;

      if (!question_id || !alternative_id) {
        return res.status(400).json({ error: 'Informe a questão (question_id) e a alternativa (alternative_id).' });
      }

      await simulationModel.saveAnswer({
        simulationId: Number(simulationId),
        userId,
        questionId: Number(question_id),
        alternativeId: Number(alternative_id),
        currentQuestionIndex: current_question_index !== undefined ? Number(current_question_index) : undefined
      });

      return res.status(200).json({ message: 'Resposta registrada no simulado.' });
    } catch (error) {
      next(error);
    }
  },
  /**
   * POST /api/simulations/:id/finish
   */
  async finish(req, res, next) {
    try {
      const userId = req.user.id;
      const simulationId = req.params.id;

      const result = await simulationModel.finishSimulation(Number(simulationId), userId);

      return res.status(200).json({
        message: 'Simulado finalizado com sucesso.',
        result
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/simulations/:id/result
   */
  async getResult(req, res, next) {
    try {
      const userId = req.user.id;
      const simulationId = req.params.id;

      const result = await simulationModel.getResult(Number(simulationId), userId);

      if (!result) {
        return res.status(404).json({ error: 'Simulado não encontrado.' });
      }

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/simulations/history
   */
  async getHistory(req, res, next) {
    try {
      const userId = req.user.id;
      const { page, limit } = req.query;

      const history = await simulationModel.getHistory(userId, {
        page: page || 1,
        limit: limit || 10
      });

      return res.status(200).json(history);
    } catch (error) {
      next(error);
    }
  }
};

module.exports = simulationController;
