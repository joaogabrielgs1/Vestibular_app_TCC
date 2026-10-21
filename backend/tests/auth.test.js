const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/database');

describe('Testes de Integração: Autenticação e Conta (ISO/IEC 25010 - Adequação Funcional e Segurança)', () => {
  const testEmail = `test_runner_${Date.now()}@tcc.edu.br`;
  const testPassword = 'password123';
  let authToken = '';

  afterAll(async () => {
    // Limpeza de dados do teste
    try {
      await db.execute('DELETE FROM users WHERE email = ?', [testEmail]);
    } catch (e) {
      // Ignora erro de limpeza
    }
  });

  test('POST /api/auth/register - Deve registrar um novo usuário com sucesso (201)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: testEmail,
        password: testPassword,
        full_name: 'Usuário de Teste Automatizado'
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toHaveProperty('email', testEmail);
    expect(res.headers).toHaveProperty('x-response-time');
    authToken = res.body.token;
  });

  test('POST /api/auth/register - Deve rejeitar e-mail duplicado (409)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: testEmail,
        password: testPassword,
        full_name: 'Usuário Duplicado'
      });

    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty('error');
  });

  test('POST /api/auth/login - Deve autenticar com credenciais corretas (200)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testEmail,
        password: testPassword
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toHaveProperty('email', testEmail);
  });

  test('POST /api/auth/login - Deve rejeitar senha incorreta (401)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testEmail,
        password: 'senha_errada_123'
      });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  test('GET /api/auth/profile - Deve retornar os dados do perfil autenticado (200)', async () => {
    const res = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('email', testEmail);
    expect(res.body).toHaveProperty('full_name', 'Usuário de Teste Automatizado');
  });

  test('GET /api/auth/profile - Deve negar acesso sem token JWT (401)', async () => {
    const res = await request(app).get('/api/auth/profile');
    expect(res.status).toBe(401);
  });

  test('PUT /api/auth/email - Deve alterar e-mail com senha correta (200)', async () => {
    const newEmail = `updated_${Date.now()}@tcc.edu.br`;
    const res = await request(app)
      .put('/api/auth/email')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        currentPassword: testPassword,
        newEmail: newEmail
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message');
  });

  test('PUT /api/auth/password - Deve alterar senha com sucesso (200)', async () => {
    const res = await request(app)
      .put('/api/auth/password')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        currentPassword: testPassword,
        newPassword: 'nova_senha_123',
        confirmPassword: 'nova_senha_123'
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message');
  });

  test('DELETE /api/auth/account - Deve excluir a conta do usuário autenticado (200)', async () => {
    const res = await request(app)
      .delete('/api/auth/account')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        password: 'nova_senha_123'
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message');
  });
});
