const answerModel = require('../models/answerModel');
const questionModel = require('../models/questionModel');

const answerController = {
  async submitAnswer(req, res, next) {
    try {
      const userId = req.user.id;
      const { question_id, alternative_id } = req.body;

      if (!question_id || !alternative_id) {
        return res.status(400).json({ error: 'Informe a questão (question_id) e a alternativa (alternative_id).' });
      }

      const question = await questionModel.findById(question_id);
      if (!question) {
        return res.status(404).json({ error: 'Questão não encontrada.' });
      }

      const chosenAlternative = question.alternatives.find(alt => alt.id === Number(alternative_id));
      if (!chosenAlternative) {
        return res.status(400).json({ error: 'A alternativa selecionada não pertence a esta questão.' });
      }

      const correctAlternative = await questionModel.getCorrectAlternative(question_id);
      const isCorrect = correctAlternative && correctAlternative.id === Number(alternative_id);

      const savedAnswer = await answerModel.createAnswer({
        userId,
        questionId: question_id,
        alternativeId: alternative_id,
        isCorrect
      });

      return res.status(201).json({
        message: 'Resposta registrada com sucesso.',
        answer_id: savedAnswer.id,
        is_correct: isCorrect,
        correct_alternative_id: correctAlternative ? correctAlternative.id : null,
        correct_letter: correctAlternative ? correctAlternative.letter : null,
        explanation: question.explanation || null
      });
    } catch (error) {
      next(error);
    }
  },

  async getHistory(req, res, next) {
    try {
      const userId = req.user.id;
      const { page, limit } = req.query;

      const history = await answerModel.getHistoryByUserId(userId, {
        page: page || 1,
        limit: limit || 20
      });

      return res.status(200).json(history);
    } catch (error) {
      next(error);
    }
  },

  async getStatistics(req, res, next) {
    try {
      const userId = req.user.id;
      const stats = await answerModel.getStatisticsByUserId(userId);
      return res.status(200).json(stats);
    } catch (error) {
      next(error);
    }
  },

  async getSubjectQuestions(req, res, next) {
    try {
      const userId = req.user.id;
      const { subjectId } = req.params;
      const { status, page, limit } = req.query;

      const result = await answerModel.getQuestionsBySubject(userId, subjectId, {
        status, // 'correct' | 'wrong' | undefined
        page: page || 1,
        limit: limit || 20
      });

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
};

module.exports = answerController;
