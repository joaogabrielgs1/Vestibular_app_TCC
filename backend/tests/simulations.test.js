const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/database');

describe('Testes de Integração: Ciclo de Vida do Simulado (ISO/IEC 25010 - Adequação Funcional e Segurança)', () => {
  const simUserEmail = `sim_runner_${Date.now()}@tcc.edu.br`;
  let authToken = '';
  let simulationId = null;
  let firstQuestion = null;

  beforeAll(async () => {
    // Registra usuário para o teste de simulado
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: simUserEmail,
        password: 'password123',
        full_name: 'Avaliador de Simulado'
      });
    authToken = regRes.body.token;
  });

  afterAll(async () => {
    try {
      await db.execute('DELETE FROM users WHERE email = ?', [simUserEmail]);
    } catch (e) {
      // Ignora erro de limpeza
    }
  });

  test('POST /api/simulations - Deve criar um novo simulado personalizado (201)', async () => {
    const res = await request(app)
      .post('/api/simulations')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Simulado de Teste Automatizado ISO 25010',
        limit: 5
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('simulation');
    expect(res.body.simulation).toHaveProperty('id');
    simulationId = res.body.simulation.id;
  });

  test('GET /api/simulations/active - Deve recuperar simulado ativo sem vazar gabarito (200)', async () => {
    const res = await request(app)
      .get('/api/simulations/active')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.active).toBe(true);
    expect(res.body.simulation).toHaveProperty('questions');
    expect(res.body.simulation.questions.length).toBeGreaterThan(0);

    firstQuestion = res.body.simulation.questions[0];

    // Verificação de Segurança (ISO/IEC 25010 - Confidencialidade): is_correct não pode estar exposto durante a prova
    firstQuestion.alternatives.forEach(alt => {
      expect(alt).not.toHaveProperty('is_correct');
    });
  });

  test('POST /api/simulations/:id/answer - Deve salvar a resposta de uma questão em tempo real (200)', async () => {
    const chosenAltId = firstQuestion.alternatives[0].id;
    const res = await request(app)
      .post(`/api/simulations/${simulationId}/answer`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        question_id: firstQuestion.question_id,
        alternative_id: chosenAltId,
        current_question_index: 0
      });

    expect(res.status).toBe(200);
  });

  test('POST /api/simulations/:id/finish - Deve finalizar prova, calcular nota e liberar gabarito (200)', async () => {
    const res = await request(app)
      .post(`/api/simulations/${simulationId}/finish`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('result');
    expect(res.body.result).toHaveProperty('accuracy_percentage');
    expect(res.body.result).toHaveProperty('total_correct');
    expect(res.body.result).toHaveProperty('total_wrong');

    // Agora o gabarito e a explicação devem estar acessíveis
    const reviewQ = res.body.result.questions[0];
    expect(reviewQ).toHaveProperty('is_correct');
    expect(reviewQ).toHaveProperty('correct_letter');
    expect(typeof reviewQ.is_correct).toBe('boolean');
  });

  test('GET /api/simulations/:id/result - Deve buscar resultado detalhado por ID (200)', async () => {
    const res = await request(app)
      .get(`/api/simulations/${simulationId}/result`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', simulationId);
    expect(res.body).toHaveProperty('accuracy_percentage');
  });

  test('GET /api/simulations/history - Deve listar histórico de simulados realizados (200)', async () => {
    const res = await request(app)
      .get('/api/simulations/history')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
