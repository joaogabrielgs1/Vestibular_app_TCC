const db = require('../config/database');

const answerModel = {
  async createAnswer({ userId, questionId, alternativeId, isCorrect }) {
    const query = `
      INSERT INTO user_answers (user_id, question_id, alternative_id, is_correct)
      VALUES (?, ?, ?, ?)
    `;
    const [result] = await db.execute(query, [userId, questionId, alternativeId, isCorrect ? 1 : 0]);
    return {
      id: result.insertId,
      userId,
      questionId,
      alternativeId,
      isCorrect: Boolean(isCorrect)
    };
  },

  async getHistoryByUserId(userId, { page = 1, limit = 20 }) {
    const offset = (Number(page) - 1) * Number(limit);

    const countQuery = `SELECT COUNT(*) as total FROM user_answers WHERE user_id = ?`;
    const [countRows] = await db.execute(countQuery, [userId]);
    const total = countRows[0].total;

    const query = `
      SELECT 
        ua.id AS answer_id,
        ua.is_correct,
        ua.answered_at,
        q.id AS question_id,
        q.statement,
        q.year,
        s.name AS subject_name,
        v.acronym AS vestibular_acronym,
        alt_chosen.letter AS chosen_letter,
        alt_chosen.text AS chosen_text,
        alt_correct.letter AS correct_letter
      FROM user_answers ua
      INNER JOIN questions q ON q.id = ua.question_id
      INNER JOIN subjects s ON s.id = q.subject_id
      INNER JOIN vestibulares v ON v.id = q.vestibular_id
      INNER JOIN alternatives alt_chosen ON alt_chosen.id = ua.alternative_id
      INNER JOIN alternatives alt_correct ON alt_correct.question_id = q.id AND alt_correct.is_correct = 1
      WHERE ua.user_id = ?
      ORDER BY ua.answered_at DESC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await db.query(query, [userId, Number(limit), Number(offset)]);

    const formattedRows = rows.map(row => ({
      ...row,
      is_correct: Boolean(row.is_correct)
    }));

    return {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
      data: formattedRows
    };
  },

  async getStatisticsByUserId(userId) {
    const overallQuery = `
      SELECT 
        COUNT(*) AS total_answered,
        COALESCE(SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END), 0) AS total_correct,
        COALESCE(SUM(CASE WHEN is_correct = 0 THEN 1 ELSE 0 END), 0) AS total_wrong
      FROM user_answers
      WHERE user_id = ?
    `;
    const [overallRows] = await db.execute(overallQuery, [userId]);
    const overall = overallRows[0];

    const totalAnswered = Number(overall.total_answered);
    const totalCorrect = Number(overall.total_correct);
    const totalWrong = Number(overall.total_wrong);
    const accuracyPercentage = totalAnswered > 0 
      ? Number(((totalCorrect / totalAnswered) * 100).toFixed(2)) 
      : 0;

    const subjectsQuery = `
      SELECT 
        s.id AS subject_id,
        s.name AS subject_name,
        COUNT(ua.id) AS total_answered,
        COALESCE(SUM(CASE WHEN ua.is_correct = 1 THEN 1 ELSE 0 END), 0) AS total_correct,
        COALESCE(SUM(CASE WHEN ua.is_correct = 0 THEN 1 ELSE 0 END), 0) AS total_wrong
      FROM user_answers ua
      INNER JOIN questions q ON q.id = ua.question_id
      INNER JOIN subjects s ON s.id = q.subject_id
      WHERE ua.user_id = ?
      GROUP BY s.id, s.name
      ORDER BY total_answered DESC
    `;
    const [subjectRows] = await db.execute(subjectsQuery, [userId]);

    const bySubject = subjectRows.map(row => {
      const answered = Number(row.total_answered);
      const correct = Number(row.total_correct);
      return {
        subject_id: row.subject_id,
        subject_name: row.subject_name,
        total_answered: answered,
        total_correct: correct,
        total_wrong: Number(row.total_wrong),
        accuracy_percentage: answered > 0 ? Number(((correct / answered) * 100).toFixed(2)) : 0
      };
    });

    return {
      overview: {
        total_answered: totalAnswered,
        total_correct: totalCorrect,
        total_wrong: totalWrong,
        accuracy_percentage: accuracyPercentage
      },
      by_subject: bySubject
    };
  },

  /**
   * Retorna as questões respondidas pelo usuário em uma matéria específica,
   * permitindo filtrar por status ('correct' ou 'wrong')
   */
  async getQuestionsBySubject(userId, subjectId, { status, page = 1, limit = 20 }) {
    const offset = (Number(page) - 1) * Number(limit);
    const params = [Number(userId), Number(subjectId)];
    const countParams = [Number(userId), Number(subjectId)];
    let statusClause = '';

    if (status === 'correct') {
      statusClause = 'AND ua.is_correct = 1';
    } else if (status === 'wrong') {
      statusClause = 'AND ua.is_correct = 0';
    }

    const countQuery = `
      SELECT COUNT(*) as total 
      FROM user_answers ua
      INNER JOIN questions q ON q.id = ua.question_id
      WHERE ua.user_id = ? AND q.subject_id = ? ${statusClause}
    `;
    const [countRows] = await db.execute(countQuery, countParams);
    const total = countRows[0].total;

    const query = `
      SELECT 
        ua.id AS answer_id,
        ua.is_correct,
        ua.answered_at,
        q.id AS question_id,
        q.statement,
        q.explanation,
        q.year,
        s.name AS subject_name,
        v.acronym AS vestibular_acronym,
        alt_chosen.letter AS chosen_letter,
        alt_chosen.text AS chosen_text,
        alt_correct.letter AS correct_letter,
        alt_correct.text AS correct_text
      FROM user_answers ua
      INNER JOIN questions q ON q.id = ua.question_id
      INNER JOIN subjects s ON s.id = q.subject_id
      INNER JOIN vestibulares v ON v.id = q.vestibular_id
      INNER JOIN alternatives alt_chosen ON alt_chosen.id = ua.alternative_id
      INNER JOIN alternatives alt_correct ON alt_correct.question_id = q.id AND alt_correct.is_correct = 1
      WHERE ua.user_id = ? AND q.subject_id = ? ${statusClause}
      ORDER BY ua.answered_at DESC
      LIMIT ? OFFSET ?
    `;

    params.push(Number(limit), Number(offset));
    const [rows] = await db.query(query, params);

    const formattedRows = rows.map(row => ({
      ...row,
      is_correct: Boolean(row.is_correct)
    }));

    return {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
      data: formattedRows
    };
  }
};

module.exports = answerModel;
