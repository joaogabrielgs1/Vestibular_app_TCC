const db = require('../config/database');

const subjectModel = {
  async findAll() {
    const query = `SELECT id, name, description FROM subjects ORDER BY name ASC`;
    const [rows] = await db.execute(query);
    return rows;
  }
};

module.exports = subjectModel;
