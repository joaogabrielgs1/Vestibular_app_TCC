/**
 * Controller de Questões — Firebase Back-end (BaaS)
 *
 * Equivalente ao questionController do back-end MVC.
 * Em vez de JOINs SQL, utiliza consultas compostas no Firestore.
 *
 * Estrutura do documento Firestore (coleção: questions):
 * {
 *   id: string,
 *   statement: string,
 *   imageUrl: string | null,
 *   explanation: string | null,
 *   year: number,
 *   subjectId: string,
 *   subjectName: string,        // desnormalizado (evita JOIN)
 *   vestibularId: string,
 *   vestibularName: string,     // desnormalizado (evita JOIN)
 *   alternatives: [
 *     { id: string, letter: string, text: string, isCorrect: boolean }
 *   ]
 * }
 *
 * Nota: a desnormalização de subjectName e vestibularName é a principal
 * diferença estrutural em relação ao modelo relacional normalizado do MySQL.
 * Essa diferença é declarada como variável de confusão no TCC.
 */

'use strict';

const questionsCol = () => global.db.collection('questions');

const questionController = {

  async list(req, res, next) {
    try {
      const { subject_id, year, vestibular_id, page = 1, limit = 10 } = req.query;

      let query = questionsCol();

      // Filtros compostos — o Firestore exige índice composto para múltiplos where()
      if (subject_id)    query = query.where('subjectId', '==', subject_id);
      if (year)          query = query.where('year', '==', Number(year));
      if (vestibular_id) query = query.where('vestibularId', '==', vestibular_id);

      // Paginação via offset (simplificado para fins de benchmark)
      const pageNum  = Math.max(1, Number(page));
      const limitNum = Math.min(50, Math.max(1, Number(limit)));
      const offset   = (pageNum - 1) * limitNum;

      // Busca total para metadados de paginação
      const totalSnap = await query.count().get();
      const total     = totalSnap.data().count;

      // Busca paginada
      const snap = await query.orderBy('year', 'desc').offset(offset).limit(limitNum).get();

      const questions = snap.docs.map(doc => {
        const d = doc.data();
        return {
          id:               doc.id,
          statement:        d.statement,
          image_url:        d.imageUrl || null,
          year:             d.year,
          subject_id:       d.subjectId,
          subject_name:     d.subjectName,
          vestibular_id:    d.vestibularId,
          vestibular_name:  d.vestibularName,
          alternatives:     (d.alternatives || []).map(a => ({
            id:     a.id,
            letter: a.letter,
            text:   a.text
            // isCorrect não é exposto na listagem
          }))
        };
      });

      return res.status(200).json({
        data:       questions,
        pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) }
      });
    } catch (err) {
      next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const doc = await questionsCol().doc(req.params.id).get();

      if (!doc.exists) {
        return res.status(404).json({ error: 'Questão não encontrada.' });
      }

      const d = doc.data();
      return res.status(200).json({
        id:              doc.id,
        statement:       d.statement,
        image_url:       d.imageUrl || null,
        explanation:     d.explanation || null,
        year:            d.year,
        subject_id:      d.subjectId,
        subject_name:    d.subjectName,
        vestibular_id:   d.vestibularId,
        vestibular_name: d.vestibularName,
        alternatives:    (d.alternatives || []).map(a => ({
          id:     a.id,
          letter: a.letter,
          text:   a.text
        }))
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = questionController;
