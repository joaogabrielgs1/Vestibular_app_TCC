const db = require('../config/database');

const simulationModel = {
  /**
   * Cria um novo simulado com base nos filtros selecionados
   */
  async createSimulation({ userId, title, subjectId, vestibularId, year, limit = 10 }) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Cancela qualquer simulado que ainda estivesse em andamento para o mesmo usuário
      await connection.execute(
        `UPDATE simulations SET status = 'CANCELADO' WHERE user_id = ? AND status = 'EM_ANDAMENTO'`,
        [userId]
      );

      // 2. Busca as questões compatíveis com os filtros
      const params = [];
      let whereClauses = [];

      if (subjectId) {
        whereClauses.push('q.subject_id = ?');
        params.push(Number(subjectId));
      }
      if (vestibularId) {
        whereClauses.push('q.vestibular_id = ?');
        params.push(Number(vestibularId));
      }
      if (year) {
        whereClauses.push('q.year = ?');
        params.push(Number(year));
      }

      // Filtra questões de benchmark
      whereClauses.push("q.statement NOT LIKE '%[benchmark%' AND q.statement NOT LIKE '%[Benchmark%'");

      const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
      const queryQuestions = `
        SELECT q.id 
        FROM questions q
        ${whereSql}
        ORDER BY RAND()
        LIMIT ?
      `;
      params.push(Number(limit));

      const [questions] = await connection.query(queryQuestions, params);

      if (questions.length === 0) {
        throw new Error('Nenhuma questão encontrada com os filtros selecionados.');
      }

      const totalQuestions = questions.length;

      // 3. Insere o cabeçalho do simulado
      const simTitle = title || `Simulado (${totalQuestions} questões)`;
      const insertSimSql = `
        INSERT INTO simulations (user_id, title, subject_id, vestibular_id, year, total_questions, status)
        VALUES (?, ?, ?, ?, ?, ?, 'EM_ANDAMENTO')
      `;
      const [simResult] = await connection.execute(insertSimSql, [
        userId,
        simTitle,
        subjectId ? Number(subjectId) : null,
        vestibularId ? Number(vestibularId) : null,
        year ? Number(year) : null,
        totalQuestions
      ]);

      const simulationId = simResult.insertId;

      // 4. Insere cada questão na tabela simulation_questions
      for (let i = 0; i < questions.length; i++) {
        const questionId = questions[i].id;
        await connection.execute(
          `INSERT INTO simulation_questions (simulation_id, question_id, order_index) VALUES (?, ?, ?)`,
          [simulationId, questionId, i]
        );
      }

      await connection.commit();

      return {
        id: simulationId,
        title: simTitle,
        totalQuestions
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  /**
   * Retorna o simulado ativo do usuário (se houver), com questões e respostas já preenchidas
   */
  async getActiveSimulation(userId) {
    const query = `
      SELECT 
        s.id,
        s.title,
        s.subject_id,
        s.vestibular_id,
        s.year,
        s.total_questions,
        s.current_question_index,
        s.status,
        s.started_at,
        sub.name AS subject_name,
        v.acronym AS vestibular_acronym
      FROM simulations s
      LEFT JOIN subjects sub ON sub.id = s.subject_id
      LEFT JOIN vestibulares v ON v.id = s.vestibular_id
      WHERE s.user_id = ? AND s.status = 'EM_ANDAMENTO'
      ORDER BY s.started_at DESC
      LIMIT 1
    `;
    const [rows] = await db.execute(query, [userId]);
    if (rows.length === 0) return null;

    const simulation = rows[0];

    // Busca as questões do simulado ordenadas por order_index
    const questionsQuery = `
      SELECT 
        sq.order_index,
        sq.selected_alternative_id,
        q.id AS question_id,
        q.year,
        q.statement,
        q.image_url,
        q.difficulty,
        sub.name AS subject_name,
        v.acronym AS vestibular_acronym
      FROM simulation_questions sq
      INNER JOIN questions q ON q.id = sq.question_id
      INNER JOIN subjects sub ON sub.id = q.subject_id
      INNER JOIN vestibulares v ON v.id = q.vestibular_id
      WHERE sq.simulation_id = ?
      ORDER BY sq.order_index ASC
    `;
    const [simQuestions] = await db.execute(questionsQuery, [simulation.id]);

    if (simQuestions.length === 0) {
      simulation.questions = [];
      return simulation;
    }

    const questionIds = simQuestions.map(q => q.question_id);
    const placeholders = questionIds.map(() => '?').join(',');

    // Busca as alternativas (sem expor o campo is_correct durante a prova)
    const alternativesQuery = `
      SELECT id, question_id, letter, text
      FROM alternatives
      WHERE question_id IN (${placeholders})
      ORDER BY question_id ASC, letter ASC
    `;
    const [alternatives] = await db.query(alternativesQuery, questionIds);

    simulation.questions = simQuestions.map(q => ({
      ...q,
      alternatives: alternatives.filter(alt => alt.question_id === q.question_id)
    }));

    return simulation;
  },

  /**
   * Salva a alternativa escolhida em uma questão do simulado
   */
  async saveAnswer({ simulationId, userId, questionId, alternativeId, currentQuestionIndex }) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Valida se o simulado pertence ao usuário e está em andamento
      const [simRows] = await connection.execute(
        `SELECT id FROM simulations WHERE id = ? AND user_id = ? AND status = 'EM_ANDAMENTO'`,
        [simulationId, userId]
      );
      if (simRows.length === 0) {
        throw new Error('Simulado não encontrado ou já finalizado.');
      }

      // Atualiza a alternativa selecionada na questão do simulado
      const updateSqSql = `
        UPDATE simulation_questions 
        SET selected_alternative_id = ?, answered_at = CURRENT_TIMESTAMP
        WHERE simulation_id = ? AND question_id = ?
      `;
      await connection.execute(updateSqSql, [Number(alternativeId), simulationId, Number(questionId)]);

      // Atualiza a posição atual no simulado
      if (currentQuestionIndex !== undefined && currentQuestionIndex !== null) {
        await connection.execute(
          `UPDATE simulations SET current_question_index = ? WHERE id = ?`,
          [Number(currentQuestionIndex), simulationId]
        );
      }

      await connection.commit();
      return { success: true };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  /**
   * Finaliza o simulado, calcula métricas e retorna o gabarito completo
   */
  async finishSimulation(simulationId, userId) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Valida o simulado
      const [simRows] = await connection.execute(
        `SELECT id, total_questions FROM simulations WHERE id = ? AND user_id = ? AND status = 'EM_ANDAMENTO'`,
        [simulationId, userId]
      );
      if (simRows.length === 0) {
        throw new Error('Simulado não encontrado ou já finalizado.');
      }

      const totalQuestions = simRows[0].total_questions;

      // Busca todas as respostas dadas no simulado e as alternativas corretas
      const checkQuery = `
        SELECT 
          sq.id AS sq_id,
          sq.question_id,
          sq.selected_alternative_id,
          correct_alt.id AS correct_alternative_id
        FROM simulation_questions sq
        INNER JOIN alternatives correct_alt ON correct_alt.question_id = sq.question_id AND correct_alt.is_correct = 1
        WHERE sq.simulation_id = ?
      `;
      const [questionsToCheck] = await connection.execute(checkQuery, [simulationId]);

      let totalCorrect = 0;
      let totalWrong = 0;

      for (const item of questionsToCheck) {
        const isCorrect = item.selected_alternative_id !== null && 
                          Number(item.selected_alternative_id) === Number(item.correct_alternative_id);

        if (isCorrect) {
          totalCorrect++;
        } else {
          totalWrong++;
        }

        // Atualiza a flag is_correct em simulation_questions
        await connection.execute(
          `UPDATE simulation_questions SET is_correct = ? WHERE id = ?`,
          [isCorrect ? 1 : 0, item.sq_id]
        );

        // Se o usuário selecionou uma alternativa, também registra no histórico geral de respostas
        if (item.selected_alternative_id) {
          await connection.execute(
            `INSERT INTO user_answers (user_id, question_id, alternative_id, is_correct) VALUES (?, ?, ?, ?)`,
            [userId, item.question_id, item.selected_alternative_id, isCorrect ? 1 : 0]
          );
        }
      }

      const accuracyPercentage = totalQuestions > 0 
        ? Number(((totalCorrect / totalQuestions) * 100).toFixed(2))
        : 0;

      // Atualiza o simulado para FINALIZADO com o resultado
      await connection.execute(
        `UPDATE simulations 
         SET status = 'FINALIZADO', 
             total_correct = ?, 
             total_wrong = ?, 
             accuracy_percentage = ?, 
             finished_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [totalCorrect, totalWrong, accuracyPercentage, simulationId]
      );

      await connection.commit();

      return this.getResult(simulationId, userId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  /**
   * Retorna o relatório completo de um simulado finalizado
   */
  async getResult(simulationId, userId) {
    const simQuery = `
      SELECT 
        s.id,
        s.title,
        s.total_questions,
        s.total_correct,
        s.total_wrong,
        s.accuracy_percentage,
        s.started_at,
        s.finished_at,
        sub.name AS subject_name,
        v.acronym AS vestibular_acronym
      FROM simulations s
      LEFT JOIN subjects sub ON sub.id = s.subject_id
      LEFT JOIN vestibulares v ON v.id = s.vestibular_id
      WHERE s.id = ? AND s.user_id = ?
      LIMIT 1
    `;
    const [simRows] = await db.execute(simQuery, [simulationId, userId]);
    if (simRows.length === 0) return null;

    const result = simRows[0];

    const questionsQuery = `
      SELECT 
        sq.order_index,
        sq.is_correct,
        q.id AS question_id,
        q.year,
        q.statement,
        q.image_url,
        q.explanation,
        sub.name AS subject_name,
        v.acronym AS vestibular_acronym,
        alt_chosen.letter AS chosen_letter,
        alt_chosen.text AS chosen_text,
        alt_correct.letter AS correct_letter,
        alt_correct.text AS correct_text
      FROM simulation_questions sq
      INNER JOIN questions q ON q.id = sq.question_id
      INNER JOIN subjects sub ON sub.id = q.subject_id
      INNER JOIN vestibulares v ON v.id = q.vestibular_id
      LEFT JOIN alternatives alt_chosen ON alt_chosen.id = sq.selected_alternative_id
      INNER JOIN alternatives alt_correct ON alt_correct.question_id = q.id AND alt_correct.is_correct = 1
      WHERE sq.simulation_id = ?
      ORDER BY sq.order_index ASC
    `;
    const [questions] = await db.execute(questionsQuery, [simulationId]);
    result.questions = questions.map(q => ({
      ...q,
      is_correct: q.is_correct === null ? null : Boolean(q.is_correct)
    }));

    return result;
  },

  /**
   * Lista o histórico de simulados finalizados do usuário
   */
  async getHistory(userId, { page = 1, limit = 10 }) {
    const offset = (Number(page) - 1) * Number(limit);

    const countQuery = `SELECT COUNT(*) as total FROM simulations WHERE user_id = ? AND status = 'FINALIZADO'`;
    const [countRows] = await db.execute(countQuery, [userId]);
    const total = countRows[0].total;

    const query = `
      SELECT 
        s.id,
        s.title,
        s.total_questions,
        s.total_correct,
        s.total_wrong,
        s.accuracy_percentage,
        s.started_at,
        s.finished_at,
        sub.name AS subject_name,
        v.acronym AS vestibular_acronym
      FROM simulations s
      LEFT JOIN subjects sub ON sub.id = s.subject_id
      LEFT JOIN vestibulares v ON v.id = s.vestibular_id
      WHERE s.user_id = ? AND s.status = 'FINALIZADO'
      ORDER BY s.finished_at DESC
      LIMIT ? OFFSET ?
    `;
    const [rows] = await db.query(query, [userId, Number(limit), Number(offset)]);

    return {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
      data: rows
    };
  }
};

module.exports = simulationModel;
