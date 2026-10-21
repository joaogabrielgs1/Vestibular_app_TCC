const db = require('../config/database');

const questionModel = {
  async findFiltered({ subjectId, year, vestibularId, page = 1, limit = 10 }) {
    const offset = (Number(page) - 1) * Number(limit);
    const params = [];
    const countParams = [];
    let whereClauses = [];

    if (subjectId) {
      whereClauses.push('q.subject_id = ?');
      params.push(Number(subjectId));
      countParams.push(Number(subjectId));
    }

    if (year) {
      whereClauses.push('q.year = ?');
      params.push(Number(year));
      countParams.push(Number(year));
    }

    if (vestibularId) {
      whereClauses.push('q.vestibular_id = ?');
      params.push(Number(vestibularId));
      countParams.push(Number(vestibularId));
    }

    // Esconde questões de benchmark do aplicativo
    whereClauses.push("q.statement NOT LIKE '%[benchmark%' AND q.statement NOT LIKE '%[Benchmark%'");

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countQuery = `SELECT COUNT(*) as total FROM questions q ${whereSql}`;
    const [countRows] = await db.execute(countQuery, countParams);
    const total = countRows[0].total;

    const listQuery = `
      SELECT 
        q.id,
        q.year,
        q.statement,
        q.image_url,
        q.difficulty,
        s.id AS subject_id,
        s.name AS subject_name,
        v.id AS vestibular_id,
        v.acronym AS vestibular_acronym,
        v.name AS vestibular_name
      FROM questions q
      INNER JOIN subjects s ON s.id = q.subject_id
      INNER JOIN vestibulares v ON v.id = q.vestibular_id
      ${whereSql}
      ORDER BY q.year DESC, q.id ASC
      LIMIT ? OFFSET ?
    `;

    params.push(Number(limit), Number(offset));
    const [questions] = await db.query(listQuery, params);

    if (questions.length === 0) {
      return {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
        data: []
      };
    }

    const questionIds = questions.map(q => q.id);
    const placeholders = questionIds.map(() => '?').join(',');

    const alternativesQuery = `
      SELECT id, question_id, letter, text
      FROM alternatives
      WHERE question_id IN (${placeholders})
      ORDER BY question_id ASC, letter ASC
    `;
    const [alternatives] = await db.query(alternativesQuery, questionIds);

    const questionsWithAlternatives = questions.map(q => {
      return {
        ...q,
        alternatives: alternatives.filter(alt => alt.question_id === q.id)
      };
    });

    return {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
      data: questionsWithAlternatives
    };
  },

  async findById(id) {
    const query = `
      SELECT 
        q.id,
        q.year,
        q.statement,
        q.image_url,
        q.explanation,
        q.difficulty,
        s.id AS subject_id,
        s.name AS subject_name,
        v.id AS vestibular_id,
        v.acronym AS vestibular_acronym,
        v.name AS vestibular_name
      FROM questions q
      INNER JOIN subjects s ON s.id = q.subject_id
      INNER JOIN vestibulares v ON v.id = q.vestibular_id
      WHERE q.id = ?
      LIMIT 1
    `;
    const [rows] = await db.execute(query, [id]);
    if (rows.length === 0) return null;

    const question = rows[0];

    const alternativesQuery = `
      SELECT id, question_id, letter, text
      FROM alternatives
      WHERE question_id = ?
      ORDER BY letter ASC
    `;
    const [alternatives] = await db.execute(alternativesQuery, [id]);
    question.alternatives = alternatives;

    return question;
  },

  async getCorrectAlternative(questionId) {
    const query = `
      SELECT id, letter, text, is_correct
      FROM alternatives
      WHERE question_id = ? AND is_correct = 1
      LIMIT 1
    `;
    const [rows] = await db.execute(query, [questionId]);
    return rows[0] || null;
  }
};

module.exports = questionModel;
