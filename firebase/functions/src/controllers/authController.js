/**
 * Controller de Autenticação — Firebase Back-end (BaaS)
 *
 * Equivalente ao authController do back-end MVC.
 * Em vez de MySQL, utiliza a coleção "users" do Cloud Firestore.
 *
 * Estrutura do documento Firestore (coleção: users):
 * {
 *   id: string (= doc ID),
 *   email: string,
 *   passwordHash: string,
 *   fullName: string,
 *   bio: string | null,
 *   avatarUrl: string | null,
 *   isActive: boolean,
 *   createdAt: Timestamp
 * }
 */

'use strict';

const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');

const JWT_SECRET     = process.env.JWT_SECRET || 'vestibular_tcc_super_jwt_secret_key_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Referência à coleção de usuários no Firestore
const usersCol = () => global.db.collection('users');

function generateToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

async function findUserByEmail(email) {
  const snap = await usersCol().where('email', '==', email).limit(1).get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { id: doc.id, ...doc.data() };
}

const authController = {

  async register(req, res, next) {
    try {
      const { email, password, full_name } = req.body;

      if (!email || !password || !full_name) {
        return res.status(400).json({ error: 'Os campos e-mail, senha e nome completo são obrigatórios.' });
      }
      if (password.length < 6) {
        return res.status(400).json({ error: 'A senha deve conter no mínimo 6 caracteres.' });
      }

      const existing = await findUserByEmail(email);
      if (existing) {
        return res.status(409).json({ error: 'Este e-mail já está cadastrado.' });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const docRef = await usersCol().add({
        email,
        passwordHash,
        fullName: full_name,
        bio: null,
        avatarUrl: null,
        isActive: true,
        createdAt: global.db.constructor.Timestamp
          ? global.db.constructor.Timestamp.now()
          : new Date()
      });

      const token = generateToken({ id: docRef.id, email });

      return res.status(201).json({
        message: 'Usuário cadastrado com sucesso.',
        token,
        user: { id: docRef.id, email, full_name }
      });
    } catch (err) {
      next(err);
    }
  },

  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Informe o e-mail e a senha.' });
      }

      const user = await findUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Credenciais inválidas.' });
      }
      if (!user.isActive) {
        return res.status(403).json({ error: 'Esta conta de usuário está desativada.' });
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ error: 'Credenciais inválidas.' });
      }

      const token = generateToken(user);

      return res.status(200).json({
        message: 'Login realizado com sucesso.',
        token,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.fullName,
          bio: user.bio,
          avatar_url: user.avatarUrl
        }
      });
    } catch (err) {
      next(err);
    }
  },

  async getProfile(req, res, next) {
    try {
      const doc = await usersCol().doc(req.user.id).get();
      if (!doc.exists) return res.status(404).json({ error: 'Usuário não encontrado.' });

      const u = doc.data();
      return res.status(200).json({
        id: doc.id,
        email: u.email,
        full_name: u.fullName,
        bio: u.bio,
        avatar_url: u.avatarUrl,
        created_at: u.createdAt
      });
    } catch (err) {
      next(err);
    }
  },

  async updateEmail(req, res, next) {
    try {
      const userId = req.user.id;
      const { current_password, new_email } = req.body;

      if (!current_password || !new_email) {
        return res.status(400).json({ error: 'Informe sua senha atual e o novo e-mail.' });
      }

      const doc = await usersCol().doc(userId).get();
      if (!doc.exists) return res.status(404).json({ error: 'Usuário não encontrado.' });

      const u = doc.data();
      const isMatch = await bcrypt.compare(current_password, u.passwordHash);
      if (!isMatch) return res.status(401).json({ error: 'Senha atual incorreta.' });

      const existing = await findUserByEmail(new_email);
      if (existing && existing.id !== userId) {
        return res.status(409).json({ error: 'Este e-mail já está sendo utilizado por outra conta.' });
      }

      await usersCol().doc(userId).update({ email: new_email });

      return res.status(200).json({
        message: 'E-mail alterado com sucesso.',
        user: { id: userId, email: new_email, full_name: u.fullName }
      });
    } catch (err) {
      next(err);
    }
  },

  async updatePassword(req, res, next) {
    try {
      const userId = req.user.id;
      const { current_password, new_password, confirm_password } = req.body;

      if (!current_password || !new_password || !confirm_password) {
        return res.status(400).json({ error: 'Preencha a senha atual, a nova senha e a confirmação.' });
      }
      if (new_password.length < 6) {
        return res.status(400).json({ error: 'A nova senha deve ter no mínimo 6 caracteres.' });
      }
      if (new_password !== confirm_password) {
        return res.status(400).json({ error: 'A nova senha e a confirmação não conferem.' });
      }

      const doc = await usersCol().doc(userId).get();
      if (!doc.exists) return res.status(404).json({ error: 'Usuário não encontrado.' });

      const isMatch = await bcrypt.compare(current_password, doc.data().passwordHash);
      if (!isMatch) return res.status(401).json({ error: 'Senha atual incorreta.' });

      const newHash = await bcrypt.hash(new_password, 10);
      await usersCol().doc(userId).update({ passwordHash: newHash });

      return res.status(200).json({ message: 'Senha alterada com sucesso.' });
    } catch (err) {
      next(err);
    }
  },

  async deleteAccount(req, res, next) {
    try {
      const userId = req.user.id;
      const { password } = req.body;

      if (!password) {
        return res.status(400).json({ error: 'Informe sua senha para confirmar a exclusão da conta.' });
      }

      const doc = await usersCol().doc(userId).get();
      if (!doc.exists) return res.status(404).json({ error: 'Usuário não encontrado.' });

      const isMatch = await bcrypt.compare(password, doc.data().passwordHash);
      if (!isMatch) return res.status(401).json({ error: 'Senha incorreta. A conta não foi excluída.' });

      await usersCol().doc(userId).delete();

      return res.status(200).json({ message: 'Conta excluída permanentemente com sucesso.' });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = authController;
