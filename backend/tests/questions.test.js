const request = require('supertest');
const app = require('../src/app');

describe('Testes de Integração: Questões e Filtros (ISO/IEC 25010 - Adequação Funcional e Desempenho)', () => {

  test('GET /api/filters/subjects - Deve retornar a lista de matérias disponíveis (200)', async () => {
    const res = await request(app).get('/api/filters/subjects');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty('name');
  });

  test('GET /api/filters/vestibulares - Deve retornar as bancas cadastradas (200)', async () => {
    const res = await request(app).get('/api/filters/vestibulares');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty('acronym');
  });

  test('GET /api/questions - Deve listar questões paginadas com alternativas (200)', async () => {
    const res = await request(app).get('/api/questions?page=1&limit=5');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
    if (res.body.data.length > 0) {
      const q = res.body.data[0];
      expect(q).toHaveProperty('statement');
      expect(q).toHaveProperty('alternatives');
      expect(Array.isArray(q.alternatives)).toBe(true);
    }
  });

  test('GET /api/filters/years - Deve retornar a lista de anos disponíveis (200)', async () => {
    const res = await request(app).get('/api/filters/years');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test('GET /api/questions/:id - Deve buscar questão por ID (200)', async () => {
    const listRes = await request(app).get('/api/questions?limit=1');
    const qId = listRes.body.data[0].id;

    const res = await request(app).get(`/api/questions/${qId}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', qId);
    expect(res.body).toHaveProperty('alternatives');
  });

  test('GET /api/questions/999999 - Deve retornar 404 para ID inexistente', async () => {
    const res = await request(app).get('/api/questions/999999');
    expect(res.status).toBe(404);
  });
});
