/**
 * Controller de Respostas — Firebase Back-end (BaaS)
 *
 * Equivalente ao answerController do back-end MVC.
 *
 * Estrutura do documento Firestore (coleção: answers):
 * {
 *   userId: string,
 *   questionId: string,
 *   alternativeId: string,
 *   isCorrect: boolean,
 *   subjectId: string,
 *   subjectName: string,   // desnormalizado
 *   answeredAt: Timestamp
 * }
 */

'use strict';

const admin = require('firebase-admin');

const answersCol   = () => global.db.collection('answers');
const questionsCol = () => global.db.collection('questions');

const answerController = {

  async submitAnswer(req, res, next) {
    try {
      const userId = req.user.id;
      const { question_id, alternative_id } = req.body;

      if (!question_id || !alternative_id) {
        return res.status(400).json({ error: 'Informe a questão (question_id) e a alternativa (alternative_id).' });
      }

      const qDoc = await questionsCol().doc(question_id).get();
      if (!qDoc.exists) {
        return res.status(404).json({ error: 'Questão não encontrada.' });
      }

      const q = qDoc.data();
      const chosen  = (q.alternatives || []).find(a => a.id === alternative_id);
      if (!chosen) {
        return res.status(400).json({ error: 'A alternativa selecionada não pertence a esta questão.' });
      }

      const correct = (q.alternatives || []).find(a => a.isCorrect);
      const isCorrect = correct && correct.id === alternative_id;

      const docRef = await answersCol().add({
        userId,
        questionId:      question_id,
        alternativeId:   alternative_id,
        isCorrect,
        subjectId:       q.subjectId,
        subjectName:     q.subjectName,
        answeredAt:      admin.firestore.FieldValue.serverTimestamp()
      });

      return res.status(201).json({
        message:               'Resposta registrada com sucesso.',
        answer_id:             docRef.id,
        is_correct:            isCorrect,
        correct_alternative_id: correct ? correct.id : null,
        correct_letter:        correct ? correct.letter : null,
        explanation:           q.explanation || null
      });
    } catch (err) {
      next(err);
    }
  },

  async getHistory(req, res, next) {
    try {
      const userId   = req.user.id;
      const page     = Math.max(1, Number(req.query.page  || 1));
      const limit    = Math.min(50, Math.max(1, Number(req.query.limit || 20)));
      const offset   = (page - 1) * limit;

      const totalSnap = await answersCol().where('userId', '==', userId).count().get();
      const total     = totalSnap.data().count;

      const snap = await answersCol()
        .where('userId', '==', userId)
        .orderBy('answeredAt', 'desc')
        .offset(offset)
        .limit(limit)
        .get();

      const history = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      return res.status(200).json({
        data:       history,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
      });
    } catch (err) {
      next(err);
    }
  },

  async getStatistics(req, res, next) {
    try {
      const userId = req.user.id;
      const snap   = await answersCol().where('userId', '==', userId).get();

      const bySubject = {};
      let totalCorrect = 0;

      snap.docs.forEach(doc => {
        const d = doc.data();
        if (!bySubject[d.subjectId]) {
          bySubject[d.subjectId] = { subjectId: d.subjectId, subjectName: d.subjectName, total: 0, correct: 0 };
        }
        bySubject[d.subjectId].total++;
        if (d.isCorrect) {
          bySubject[d.subjectId].correct++;
          totalCorrect++;
        }
      });

      const subjects = Object.values(bySubject).map(s => ({
        ...s,
        accuracy: s.total > 0 ? ((s.correct / s.total) * 100).toFixed(1) : '0.0'
      }));

      return res.status(200).json({
        total_answered: snap.size,
        total_correct:  totalCorrect,
        accuracy:       snap.size > 0 ? ((totalCorrect / snap.size) * 100).toFixed(1) : '0.0',
        by_subject:     subjects
      });
    } catch (err) {
      next(err);
    }
  },

  async getSubjectQuestions(req, res, next) {
    try {
      const userId    = req.user.id;
      const subjectId = req.params.subjectId;
      const { status, page = 1, limit = 20 } = req.query;

      let query = answersCol()
        .where('userId', '==', userId)
        .where('subjectId', '==', subjectId);

      if (status === 'correct') query = query.where('isCorrect', '==', true);
      if (status === 'wrong')   query = query.where('isCorrect', '==', false);

      const pageNum  = Math.max(1, Number(page));
      const limitNum = Math.min(50, Math.max(1, Number(limit)));
      const offset   = (pageNum - 1) * limitNum;

      const totalSnap = await query.count().get();
      const total     = totalSnap.data().count;

      const snap = await query.orderBy('answeredAt', 'desc').offset(offset).limit(limitNum).get();
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      return res.status(200).json({
        data,
        pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) }
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = answerController;
