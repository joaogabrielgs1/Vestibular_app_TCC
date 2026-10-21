const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');

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

      const existingUser = await userModel.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({ error: 'Este e-mail já está cadastrado.' });
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const newUser = await userModel.create(email, passwordHash, full_name);

      const token = jwt.sign(
        { id: newUser.id, email: newUser.email },
        process.env.JWT_SECRET || 'vestibular_tcc_super_jwt_secret_key_2026',
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      return res.status(201).json({
        message: 'Usuário cadastrado com sucesso.',
        token,
        user: {
          id: newUser.id,
          email: newUser.email,
          full_name: newUser.fullName
        }
      });
    } catch (error) {
      next(error);
    }
  },

  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Informe o e-mail e a senha.' });
      }

      const user = await userModel.findByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Credenciais inválidas.' });
      }

      if (!user.is_active) {
        return res.status(403).json({ error: 'Esta conta de usuário está desativada.' });
      }

      const isPasswordMatch = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordMatch) {
        return res.status(401).json({ error: 'Credenciais inválidas.' });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET || 'vestibular_tcc_super_jwt_secret_key_2026',
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      return res.status(200).json({
        message: 'Login realizado com sucesso.',
        token,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          bio: user.bio,
          avatar_url: user.avatar_url
        }
      });
    } catch (error) {
      next(error);
    }
  },

  async getProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const user = await userModel.findById(userId);

      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado.' });
      }

      return res.status(200).json({
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        bio: user.bio,
        avatar_url: user.avatar_url,
        created_at: user.created_at
      });
    } catch (error) {
      next(error);
    }
  },

  async updateProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const { full_name, bio, avatar_url } = req.body;

      if (!full_name && bio === undefined && avatar_url === undefined) {
        return res.status(400).json({ error: 'Nenhum dado informado para atualização.' });
      }

      const updatedUser = await userModel.updateProfile(userId, {
        fullName: full_name,
        bio,
        avatarUrl: avatar_url
      });

      return res.status(200).json({
        message: 'Perfil atualizado com sucesso.',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          full_name: updatedUser.full_name,
          bio: updatedUser.bio,
          avatar_url: updatedUser.avatar_url
        }
      });
    } catch (error) {
      next(error);
    }
  },

  async updateEmail(req, res, next) {
    try {
      const userId = req.user.id;
      const current_password = req.body.current_password || req.body.currentPassword;
      const new_email = req.body.new_email || req.body.newEmail;

      if (!current_password || !new_email) {
        return res.status(400).json({ error: 'Informe sua senha atual e o novo e-mail.' });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(new_email)) {
        return res.status(400).json({ error: 'Formato de e-mail inválido.' });
      }

      const currentHash = await userModel.getPasswordHash(userId);
      if (!currentHash) {
        return res.status(404).json({ error: 'Usuário não encontrado.' });
      }

      const isMatch = await bcrypt.compare(current_password, currentHash);
      if (!isMatch) {
        return res.status(401).json({ error: 'Senha atual incorreta.' });
      }

      const existingUser = await userModel.findByEmail(new_email);
      if (existingUser && existingUser.id !== userId) {
        return res.status(409).json({ error: 'Este e-mail já está sendo utilizado por outra conta.' });
      }

      const updatedUser = await userModel.updateEmail(userId, new_email);

      return res.status(200).json({
        message: 'E-mail alterado com sucesso.',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          full_name: updatedUser.full_name
        }
      });
    } catch (error) {
      next(error);
    }
  },

  async updatePassword(req, res, next) {
    try {
      const userId = req.user.id;
      const current_password = req.body.current_password || req.body.currentPassword;
      const new_password = req.body.new_password || req.body.newPassword;
      const confirm_password = req.body.confirm_password || req.body.confirmPassword;

      if (!current_password || !new_password || !confirm_password) {
        return res.status(400).json({ error: 'Preencha a senha atual, a nova senha e a confirmação.' });
      }

      if (new_password.length < 6) {
        return res.status(400).json({ error: 'A nova senha deve ter no mínimo 6 caracteres.' });
      }

      if (new_password !== confirm_password) {
        return res.status(400).json({ error: 'A nova senha e a confirmação não conferem.' });
      }

      const currentHash = await userModel.getPasswordHash(userId);
      if (!currentHash) {
        return res.status(404).json({ error: 'Usuário não encontrado.' });
      }

      const isMatch = await bcrypt.compare(current_password, currentHash);
      if (!isMatch) {
        return res.status(401).json({ error: 'Senha atual incorreta.' });
      }

      const salt = await bcrypt.genSalt(10);
      const newHash = await bcrypt.hash(new_password, salt);

      await userModel.updatePassword(userId, newHash);

      return res.status(200).json({ message: 'Senha alterada com sucesso.' });
    } catch (error) {
      next(error);
    }
  },

  async deleteAccount(req, res, next) {
    try {
      const userId = req.user.id;
      const { password } = req.body;

      if (!password) {
        return res.status(400).json({ error: 'Informe sua senha para confirmar a exclusão da conta.' });
      }

      const currentHash = await userModel.getPasswordHash(userId);
      if (!currentHash) {
        return res.status(404).json({ error: 'Usuário não encontrado.' });
      }

      const isMatch = await bcrypt.compare(password, currentHash);
      if (!isMatch) {
        return res.status(401).json({ error: 'Senha incorreta. A conta não foi excluída.' });
      }

      await userModel.deleteAccount(userId);

      return res.status(200).json({ message: 'Conta excluída permanentemente com sucesso.' });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = authController;
