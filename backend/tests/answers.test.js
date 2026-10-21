const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/database');

describe('Testes de Integração: Respostas, Histórico e Estatísticas (ISO/IEC 25010 - Adequação Funcional e Confiabilidade)', () => {
  const ansUserEmail = `ans_runner_${Date.now()}@tcc.edu.br`;
  let authToken = '';
  let sampleQuestion = null;

  beforeAll(async () => {
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: ansUserEmail,
        password: 'password123',
        full_name: 'Avaliador de Estatísticas'
      });
    authToken = regRes.body.token;

    // Busca uma questão para teste
    const qRes = await request(app).get('/api/questions?limit=1');
    if (qRes.body.data && qRes.body.data.length > 0) {
      sampleQuestion = qRes.body.data[0];
    }
  });

  afterAll(async () => {
    try {
      await db.execute('DELETE FROM users WHERE email = ?', [ansUserEmail]);
    } catch (e) {
      // Ignora erro de limpeza
    }
  });

  test('POST /api/answers - Deve registrar resposta avulsa e retornar correção imediata (201)', async () => {
    if (!sampleQuestion) return;

    const altId = sampleQuestion.alternatives[0].id;
    const res = await request(app)
      .post('/api/answers')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        question_id: sampleQuestion.id,
        alternative_id: altId
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('is_correct');
    expect(typeof res.body.is_correct).toBe('boolean');
  });

  test('GET /api/answers/history - Deve retornar histórico com tipagem booleana correta (200)', async () => {
    const res = await request(app)
      .get('/api/answers/history')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);

    if (res.body.data.length > 0) {
      const item = res.body.data[0];
      expect(typeof item.is_correct).toBe('boolean');
      expect(item).toHaveProperty('chosen_letter');
      expect(item).toHaveProperty('statement');
    }
  });

  test('GET /api/answers/statistics - Deve retornar métricas consolidadas e agrupadas por matéria (200)', async () => {
    const res = await request(app)
      .get('/api/answers/statistics')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('overview');
    expect(res.body.overview).toHaveProperty('total_answered');
    expect(res.body.overview).toHaveProperty('accuracy_percentage');
    expect(res.body).toHaveProperty('by_subject');
    expect(Array.isArray(res.body.by_subject)).toBe(true);
  });

  test('GET /api/answers/subject/1 - Deve listar questões resolvidas de uma matéria (200)', async () => {
    const res = await request(app)
      .get('/api/answers/subject/1?status=all')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
