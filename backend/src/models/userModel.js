const db = require('../config/database');

const userModel = {
  async findByEmail(email) {
    const query = `
      SELECT u.id, u.email, u.password_hash, u.is_active, p.full_name, p.bio, p.avatar_url
      FROM users u
      LEFT JOIN user_profiles p ON p.user_id = u.id
      WHERE u.email = ?
      LIMIT 1
    `;
    const [rows] = await db.execute(query, [email]);
    return rows[0] || null;
  },

  async findById(id) {
    const query = `
      SELECT u.id, u.email, u.is_active, u.created_at, p.full_name, p.bio, p.avatar_url
      FROM users u
      LEFT JOIN user_profiles p ON p.user_id = u.id
      WHERE u.id = ?
      LIMIT 1
    `;
    const [rows] = await db.execute(query, [id]);
    return rows[0] || null;
  },

  async create(email, passwordHash, fullName) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const userQuery = `INSERT INTO users (email, password_hash) VALUES (?, ?)`;
      const [userResult] = await connection.execute(userQuery, [email, passwordHash]);
      const userId = userResult.insertId;

      const profileQuery = `INSERT INTO user_profiles (user_id, full_name) VALUES (?, ?)`;
      await connection.execute(profileQuery, [userId, fullName]);

      await connection.commit();
      return { id: userId, email, fullName };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  async updateProfile(userId, { fullName, bio, avatarUrl }) {
    const query = `
      UPDATE user_profiles
      SET full_name = COALESCE(?, full_name),
          bio = COALESCE(?, bio),
          avatar_url = COALESCE(?, avatar_url)
      WHERE user_id = ?
    `;
    await db.execute(query, [fullName || null, bio || null, avatarUrl || null, userId]);
    return this.findById(userId);
  },

  async getPasswordHash(userId) {
    const query = `SELECT password_hash FROM users WHERE id = ? LIMIT 1`;
    const [rows] = await db.execute(query, [userId]);
    return rows[0] ? rows[0].password_hash : null;
  },

  async updateEmail(userId, newEmail) {
    const query = `UPDATE users SET email = ? WHERE id = ?`;
    await db.execute(query, [newEmail, userId]);
    return this.findById(userId);
  },

  async updatePassword(userId, newPasswordHash) {
    const query = `UPDATE users SET password_hash = ? WHERE id = ?`;
    await db.execute(query, [newPasswordHash, userId]);
    return { success: true };
  },

  async deleteAccount(userId) {
    const query = `DELETE FROM users WHERE id = ?`;
    const [result] = await db.execute(query, [userId]);
    return result.affectedRows > 0;
  }
};

module.exports = userModel;
