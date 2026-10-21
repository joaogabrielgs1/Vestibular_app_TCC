/**
 * Controller de Simulados — Firebase Back-end (BaaS)
 *
 * Equivalente ao simulationController do back-end MVC.
 *
 * Estrutura do documento Firestore (coleção: simulations):
 * {
 *   userId: string,
 *   status: 'active' | 'finished',
 *   score: number | null,
 *   totalQuestions: number,
 *   correctAnswers: number | null,
 *   createdAt: Timestamp,
 *   finishedAt: Timestamp | null,
 *   questions: [              // subcoleção ou array desnormalizado
 *     { questionId: string, statement: string, alternatives: [...], answeredAlternativeId: string|null }
 *   ]
 * }
 */

'use strict';

const admin = require('firebase-admin');

const simulationsCol = () => global.db.collection('simulations');
const questionsCol   = () => global.db.collection('questions');

const simulationController = {

  async create(req, res, next) {
    try {
      const userId = req.user.id;
      const { subject_ids, total_questions = 10 } = req.body;

      if (!subject_ids || !Array.isArray(subject_ids) || subject_ids.length === 0) {
        return res.status(400).json({ error: 'Informe ao menos uma matéria (subject_ids).' });
      }

      // Busca questões filtradas pelas matérias selecionadas
      const snap = await questionsCol()
        .where('subjectId', 'in', subject_ids.slice(0, 10)) // Firestore: máximo 10 valores no 'in'
        .limit(Number(total_questions))
        .get();

      if (snap.empty) {
        return res.status(404).json({ error: 'Nenhuma questão encontrada para as matérias selecionadas.' });
      }

      const questions = snap.docs.map(doc => {
        const d = doc.data();
        return {
          questionId:              doc.id,
          statement:               d.statement,
          imageUrl:                d.imageUrl || null,
          subjectId:               d.subjectId,
          subjectName:             d.subjectName,
          alternatives:            (d.alternatives || []).map(a => ({
            id: a.id, letter: a.letter, text: a.text
          })),
          answeredAlternativeId:   null,
          isCorrect:               null
        };
      });

      const docRef = await simulationsCol().add({
        userId,
        status:          'active',
        totalQuestions:  questions.length,
        correctAnswers:  null,
        score:           null,
        questions,
        createdAt:       admin.firestore.FieldValue.serverTimestamp(),
        finishedAt:      null
      });

      return res.status(201).json({
        message:        'Simulado criado com sucesso.',
        simulation_id:  docRef.id,
        total_questions: questions.length,
        questions:      questions.map(q => ({
          question_id:  q.questionId,
          statement:    q.statement,
          image_url:    q.imageUrl,
          subject_name: q.subjectName,
          alternatives: q.alternatives
        }))
      });
    } catch (err) {
      next(err);
    }
  },

  async getActive(req, res, next) {
    try {
      const userId = req.user.id;

      const snap = await simulationsCol()
        .where('userId', '==', userId)
        .where('status', '==', 'active')
        .orderBy('createdAt', 'desc')
        .limit(1)
        .get();

      if (snap.empty) {
        return res.status(404).json({ error: 'Nenhum simulado ativo encontrado.' });
      }

      const doc = snap.docs[0];
      const d   = doc.data();

      return res.status(200).json({
        simulation_id:   doc.id,
        status:          d.status,
        total_questions: d.totalQuestions,
        questions:       d.questions
      });
    } catch (err) {
      next(err);
    }
  },

  async saveAnswer(req, res, next) {
    try {
      const userId       = req.user.id;
      const simulationId = req.params.id;
      const { question_id, alternative_id } = req.body;

      const ref = simulationsCol().doc(simulationId);
      const doc = await ref.get();

      if (!doc.exists || doc.data().userId !== userId) {
        return res.status(404).json({ error: 'Simulado não encontrado.' });
      }
      if (doc.data().status !== 'active') {
        return res.status(400).json({ error: 'Este simulado já foi finalizado.' });
      }

      const questions = doc.data().questions || [];
      const idx = questions.findIndex(q => q.questionId === question_id);

      if (idx === -1) {
        return res.status(400).json({ error: 'Questão não pertence a este simulado.' });
      }

      questions[idx].answeredAlternativeId = alternative_id;
      await ref.update({ questions });

      return res.status(200).json({ message: 'Resposta salva com sucesso.' });
    } catch (err) {
      next(err);
    }
  },

  async finish(req, res, next) {
    try {
      const userId       = req.user.id;
      const simulationId = req.params.id;

      const ref = simulationsCol().doc(simulationId);
      const doc = await ref.get();

      if (!doc.exists || doc.data().userId !== userId) {
        return res.status(404).json({ error: 'Simulado não encontrado.' });
      }
      if (doc.data().status !== 'active') {
        return res.status(400).json({ error: 'Este simulado já foi finalizado.' });
      }

      // Busca dados completos das questões (com isCorrect) para calcular pontuação
      const questions   = doc.data().questions || [];
      const qDocs       = await Promise.all(
        questions.map(q => questionsCol().doc(q.questionId).get())
      );

      let correctAnswers = 0;
      const updatedQs = questions.map((q, i) => {
        const qData    = qDocs[i].exists ? qDocs[i].data() : {};
        const correct  = (qData.alternatives || []).find(a => a.isCorrect);
        const isCorrect = correct && correct.id === q.answeredAlternativeId;
        if (isCorrect) correctAnswers++;
        return { ...q, isCorrect, correctAlternativeId: correct ? correct.id : null };
      });

      const score = questions.length > 0
        ? parseFloat(((correctAnswers / questions.length) * 10).toFixed(2))
        : 0;

      await ref.update({
        status:         'finished',
        correctAnswers,
        score,
        questions:      updatedQs,
        finishedAt:     admin.firestore.FieldValue.serverTimestamp()
      });

      return res.status(200).json({
        message:          'Simulado finalizado com sucesso.',
        simulation_id:    simulationId,
        total_questions:  questions.length,
        correct_answers:  correctAnswers,
        score
      });
    } catch (err) {
      next(err);
    }
  },

  async getResult(req, res, next) {
    try {
      const userId       = req.user.id;
      const simulationId = req.params.id;

      const doc = await simulationsCol().doc(simulationId).get();

      if (!doc.exists || doc.data().userId !== userId) {
        return res.status(404).json({ error: 'Simulado não encontrado.' });
      }

      const d = doc.data();

      return res.status(200).json({
        simulation_id:   doc.id,
        status:          d.status,
        total_questions: d.totalQuestions,
        correct_answers: d.correctAnswers,
        score:           d.score,
        finished_at:     d.finishedAt,
        questions:       d.questions
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

      const query     = simulationsCol().where('userId', '==', userId).where('status', '==', 'finished');
      const totalSnap = await query.count().get();
      const total     = totalSnap.data().count;

      const snap = await query.orderBy('finishedAt', 'desc').offset(offset).limit(limit).get();
      const data = snap.docs.map(doc => {
        const d = doc.data();
        return {
          simulation_id:   doc.id,
          total_questions: d.totalQuestions,
          correct_answers: d.correctAnswers,
          score:           d.score,
          finished_at:     d.finishedAt
        };
      });

      return res.status(200).json({
        data,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = simulationController;
