/**
 * Controller de Filtros — Firebase Back-end (BaaS)
 *
 * Equivalente ao filterController do back-end MVC.
 * Matérias, vestibulares e anos são armazenados em coleções próprias
 * no Firestore (subjects, vestibulares) — sem JOIN necessário.
 */

'use strict';

const filterController = {

  async getSubjects(req, res, next) {
    try {
      const snap = await global.db.collection('subjects').orderBy('name').get();
      const subjects = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return res.status(200).json(subjects);
    } catch (err) {
      next(err);
    }
  },

  async getVestibulares(req, res, next) {
    try {
      const snap = await global.db.collection('vestibulares').orderBy('name').get();
      const vestibulares = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return res.status(200).json(vestibulares);
    } catch (err) {
      next(err);
    }
  },

  async getYears(req, res, next) {
    try {
      // Busca anos distintos das questões (sem GROUP BY — Firestore não suporta agregação direta)
      const snap  = await global.db.collection('questions').select('year').get();
      const years = [...new Set(snap.docs.map(d => d.data().year))].sort((a, b) => b - a);
      return res.status(200).json(years);
    } catch (err) {
      next(err);
    }
  }
};

module.exports = filterController;
