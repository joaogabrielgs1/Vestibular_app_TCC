const db = require('../config/database');

const vestibularModel = {
  async findAll() {
    const query = `SELECT id, name, acronym FROM vestibulares ORDER BY acronym ASC`;
    const [rows] = await db.execute(query);
    return rows;
  },

  async findDistinctYears() {
    const query = `SELECT DISTINCT year FROM questions ORDER BY year DESC`;
    const [rows] = await db.execute(query);
    return rows.map(r => r.year);
  }
};

module.exports = vestibularModel;
